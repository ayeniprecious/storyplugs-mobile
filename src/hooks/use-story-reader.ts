import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

import { FREE_ARCHIVE_WINDOW_DAYS } from '@/constants/premium';
import { useProfile } from '@/context/profile-context';
import { isDownloaded, readDownloadedContent } from '@/hooks/use-downloads';
import { useStoryChapters } from '@/hooks/use-story-chapters';
import { useStoryProgress } from '@/hooks/use-story-progress';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import type { Story, StoryChapter } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export const AUTO_SCROLL_SPEEDS = [0.4, 0.8, 1.4, 2.2, 3.2];
const AUTO_SCROLL_INTERVAL_MS = 50;

const DAY_MS = 24 * 60 * 60 * 1000;
function isOutsideFreeArchiveWindow(publishedAt: string) {
  return Date.now() - new Date(publishedAt).getTime() > FREE_ARCHIVE_WINDOW_DAYS * DAY_MS;
}

// Shared by the normal reading page and the dedicated Reader Mode page --
// story/chapter loading, audio/TTS, progress tracking, and scroll-driven
// progress reporting are identical on both; only the surrounding chrome
// (which sections render, which settings are shown) differs per page. Takes
// the consuming page's own ScrollView ref so scroll-position tracking and
// auto-scroll stay correctly bound to whichever page is actually mounted.
export function useStoryReader(
  id: string | undefined,
  chapter: string | undefined,
  scrollRef: RefObject<ScrollView | null>
) {
  const { profile } = useProfile();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Set only when this story is being read from its on-disk download rather
  // than the network -- see the load() effect below.
  const [offlineChapters, setOfflineChapters] = useState<StoryChapter[] | null>(null);
  // True once load() has determined whether this story is downloaded. Gating
  // the network chapters fetch on this (rather than just `offlineChapters`)
  // matters because an empty offlineChapters array (non-chaptered stories) is
  // still truthy in JS, and because both effects otherwise start on the same
  // render -- without this flag, useStoryChapters could fire its network
  // fetch before the async isDownloaded() check below has resolved.
  const [downloadChecked, setDownloadChecked] = useState(false);
  const scrollDimsRef = useRef({ contentHeight: 0, viewportHeight: 0 });
  const autoScrollYRef = useRef(0);
  const bodyBlockRef = useRef({ y: 0, height: 0 });
  const [autoScrollOn, setAutoScrollOn] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2);

  // Free accounts can't read chapter content for stories outside the archive
  // window -- skip the fetch entirely by passing an empty id (useStoryChapters
  // treats that as "nothing to load"). Already-downloaded stories also skip
  // the network fetch -- offlineChapters, once set, is the source of truth.
  const isArchiveLocked =
    !!story?.published_at && !profile?.is_premium && isOutsideFreeArchiveWindow(story.published_at);
  const { chapters: networkChapters, loading: networkChaptersLoading } = useStoryChapters(
    isArchiveLocked || offlineChapters || !downloadChecked ? '' : id ?? ''
  );
  const chapters = offlineChapters ?? networkChapters;
  const chaptersLoading = offlineChapters ? false : !downloadChecked || networkChaptersLoading;
  const { progress, markComplete, updateProgressPercent } = useStoryProgress(id ?? '');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setDownloadChecked(false);

      if (id && (await isDownloaded(id))) {
        const offline = await readDownloadedContent(id);
        if (!cancelled && offline) {
          setStory(offline.story);
          setOfflineChapters(offline.chapters);
          setDownloadChecked(true);
          setLoading(false);
          return;
        }
      }

      if (!cancelled) setDownloadChecked(true);

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();

      if (!cancelled) {
        setOfflineChapters(null);
        if (error || !data) {
          setNotFound(true);
        } else {
          setStory(data as Story);
        }
        setLoading(false);
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Chapter navigation only changes the `chapter` param on this same mounted
  // screen (router.setParams), so `loading`/`chaptersLoading` don't reset and
  // the ScrollView keeps whatever offset the previous chapter was left at --
  // without this, chapter 2 would open already scrolled down to wherever
  // "Next Chapter" was tapped in chapter 1.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    scrollDimsRef.current = { contentHeight: 0, viewportHeight: 0 };
    autoScrollYRef.current = 0;
    setAutoScrollOn(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, chapter]);

  const hasChapters = chapters.length > 0;
  const requestedChapter = chapter ? parseInt(chapter, 10) : 1;
  const chapterIndex = hasChapters
    ? Math.max(0, Math.min(chapters.length - 1, requestedChapter - 1))
    : 0;
  const totalChapters = hasChapters ? chapters.length : 1;
  const currentChapter = hasChapters ? chapters[chapterIndex] : null;
  const bodyText = currentChapter ? currentChapter.body : (story?.body ?? '');

  const hasRecordedAudio = !!story?.audio_url;
  const player = useAudioPlayer(story?.audio_url ? { uri: story.audio_url } : null);
  const playerStatus = useAudioPlayerStatus(player);
  const tts = useTextToSpeech(bodyText);
  const isListening = hasRecordedAudio ? playerStatus.playing : tts.speaking;

  // A story's overall progress is how far through ALL of its chapters the
  // reader is, not just the current one -- otherwise scrolling to the bottom
  // of chapter 1 of 5 would report 100%.
  const reportProgress = useCallback(
    (chapterScrollPercent: number) => {
      const clamped = Math.min(100, Math.max(0, chapterScrollPercent));
      const overall = Math.min(100, Math.round(((chapterIndex + clamped / 100) / totalChapters) * 100));
      updateProgressPercent(overall);
    },
    [chapterIndex, totalChapters, updateProgressPercent]
  );

  function maybeReportFullyVisible() {
    const { contentHeight, viewportHeight } = scrollDimsRef.current;
    if (contentHeight > 0 && viewportHeight > 0 && contentHeight <= viewportHeight) {
      reportProgress(100);
    }
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    autoScrollYRef.current = contentOffset.y;
    const scrollable = contentSize.height - layoutMeasurement.height;
    reportProgress(scrollable <= 0 ? 100 : (contentOffset.y / scrollable) * 100);
  }

  function handleContentSizeChange(_width: number, height: number) {
    scrollDimsRef.current.contentHeight = height;
    maybeReportFullyVisible();
  }

  function handleScrollViewLayout(event: LayoutChangeEvent) {
    scrollDimsRef.current.viewportHeight = event.nativeEvent.layout.height;
    maybeReportFullyVisible();
  }

  function handleBodyLayout(event: LayoutChangeEvent) {
    bodyBlockRef.current = { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height };
  }

  // Keeps the screen in sync with the TTS voice: estimates the current sentence's on-screen
  // position and scrolls to bring it back into view whenever it's drifted off-screen. Skipped
  // while the manual auto-scroll below is running, since that's an explicit user choice.
  useEffect(() => {
    if (autoScrollOn) return;
    if (tts.currentIndex < 0 || tts.sentences.length <= 1) return;
    const { y, height } = bodyBlockRef.current;
    if (height === 0) return;
    const estimatedY = y + (tts.currentIndex / (tts.sentences.length - 1)) * height;
    const { viewportHeight } = scrollDimsRef.current;
    const visibleTop = autoScrollYRef.current;
    const visibleBottom = visibleTop + viewportHeight;
    const margin = 80;
    if (estimatedY < visibleTop + margin || estimatedY > visibleBottom - margin) {
      const targetY = Math.max(0, estimatedY - viewportHeight * 0.3);
      autoScrollYRef.current = targetY;
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tts.currentIndex, autoScrollOn, tts.sentences.length]);

  useEffect(() => {
    if (!autoScrollOn) return;
    const interval = setInterval(() => {
      const { contentHeight, viewportHeight } = scrollDimsRef.current;
      const maxY = Math.max(0, contentHeight - viewportHeight);
      const nextY = Math.min(maxY, autoScrollYRef.current + AUTO_SCROLL_SPEEDS[speedIndex]);
      autoScrollYRef.current = nextY;
      scrollRef.current?.scrollTo({ y: nextY, animated: false });
      if (nextY >= maxY) setAutoScrollOn(false);
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScrollOn, speedIndex]);

  function goToChapter(nextChapterNumber: number) {
    router.setParams({ chapter: String(nextChapterNumber) });
  }

  function handleListenToggle() {
    if (hasRecordedAudio) {
      if (playerStatus.playing) player.pause();
      else player.play();
    } else {
      tts.toggle();
    }
  }

  function adjustSpeed(delta: number) {
    setSpeedIndex((prev) => Math.min(AUTO_SCROLL_SPEEDS.length - 1, Math.max(0, prev + delta)));
  }

  return {
    story,
    loading,
    notFound,
    chapters,
    chaptersLoading,
    hasChapters,
    chapterIndex,
    totalChapters,
    currentChapter,
    bodyText,
    isArchiveLocked,
    progress,
    markComplete,
    hasRecordedAudio,
    playerStatus,
    tts,
    isListening,
    handleScroll,
    handleContentSizeChange,
    handleScrollViewLayout,
    handleBodyLayout,
    autoScrollOn,
    setAutoScrollOn,
    speedIndex,
    adjustSpeed,
    goToChapter,
    handleListenToggle,
  };
}
