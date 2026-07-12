import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { CommentsSection } from '@/components/comments-section';
import { JournalComposer } from '@/components/journal-composer';
import { PremiumLockModal } from '@/components/premium-lock-modal';
import { ReportModal } from '@/components/report-modal';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FREE_ARCHIVE_WINDOW_DAYS } from '@/constants/premium';
import { Colors, Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useProfile } from '@/context/profile-context';
import { useThemePrefs } from '@/context/theme-prefs-context';
import { isDownloaded, readDownloadedContent, useDownloads } from '@/hooks/use-downloads';
import { useRecordActivity } from '@/hooks/use-record-activity';
import { useStoryChapters } from '@/hooks/use-story-chapters';
import { useStoryProgress } from '@/hooks/use-story-progress';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import type { Story, StoryChapter } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

const BODY_FONT_SIZE = 16;
const TITLE_FONT_SIZE = 25;
const READER_FONT_MIN = 0.85;
const READER_FONT_MAX = 1.6;
const READER_FONT_STEP = 0.15;

// px advanced per tick -- 5 levels from a gentle drift to a brisk pace.
const AUTO_SCROLL_SPEEDS = [0.4, 0.8, 1.4, 2.2, 3.2];
const AUTO_SCROLL_INTERVAL_MS = 50;

const DAY_MS = 24 * 60 * 60 * 1000;
function isOutsideFreeArchiveWindow(publishedAt: string) {
  return Date.now() - new Date(publishedAt).getTime() > FREE_ARCHIVE_WINDOW_DAYS * DAY_MS;
}

export default function StoryRead() {
  const { id, chapter } = useLocalSearchParams<{ id: string; chapter?: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Set only when this story is being read from its on-disk download rather
  // than the network -- see the load() effect below.
  const [offlineChapters, setOfflineChapters] = useState<StoryChapter[] | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollDimsRef = useRef({ contentHeight: 0, viewportHeight: 0 });
  const autoScrollYRef = useRef(0);
  const bodyBlockRef = useRef({ y: 0, height: 0 });

  const { profile } = useProfile();
  const { downloads, downloadStory, removeDownload } = useDownloads();
  // Free accounts can't read chapter content for stories outside the archive
  // window -- skip the fetch entirely by passing an empty id (useStoryChapters
  // treats that as "nothing to load"). See isArchiveLocked below for the
  // full-screen lock state this backs. Already-downloaded stories also skip
  // the network fetch -- offlineChapters, once set, is the source of truth.
  const isArchiveLocked =
    !!story?.published_at && !profile?.is_premium && isOutsideFreeArchiveWindow(story.published_at);
  const { chapters: networkChapters, loading: networkChaptersLoading } = useStoryChapters(
    isArchiveLocked || offlineChapters ? '' : id ?? ''
  );
  const chapters = offlineChapters ?? networkChapters;
  const chaptersLoading = offlineChapters ? false : networkChaptersLoading;
  const { progress, markComplete, updateProgressPercent } = useStoryProgress(id ?? '');
  const { labels: categoryLabels } = useCategories();
  const { resolvedScheme } = useThemePrefs();
  const [reportingStory, setReportingStory] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [showDownloadLock, setShowDownloadLock] = useState(false);
  useRecordActivity();

  // Reader Mode -- premium-gated. Its theme/font settings are deliberately independent of
  // the app-wide Appearance settings, since a reader may want a different look while
  // actually reading than they use for the rest of the app.
  const [readerModeActive, setReaderModeActive] = useState(false);
  const [showPremiumLock, setShowPremiumLock] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'light' | 'dark'>(resolvedScheme);
  const [readerFontScale, setReaderFontScale] = useState(1);
  const [autoScrollOn, setAutoScrollOn] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      if (id && isDownloaded(id)) {
        const offline = await readDownloadedContent(id);
        if (!cancelled && offline) {
          setStory(offline.story);
          setOfflineChapters(offline.chapters);
          setLoading(false);
          return;
        }
      }

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
  // screen (router.setParams), so neither `loading` nor `chaptersLoading`
  // resets and the ScrollView keeps whatever offset the previous chapter was
  // left at — without this, chapter 2 would open already scrolled down to
  // wherever "Next Chapter" was tapped in chapter 1.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    scrollDimsRef.current = { contentHeight: 0, viewportHeight: 0 };
    autoScrollYRef.current = 0;
    setAutoScrollOn(false);
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
  // of chapter 1 of 5 would report 100%, and the Library progress bar would
  // be meaningless for any multi-chapter story.
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
    // A chapter short enough to need no scrolling would otherwise never fire
    // a scroll event at all, leaving its share of progress stuck at 0.
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
  // position (proportionally, by how far through the body's sentences it is) and scrolls to
  // bring it back into view whenever it's drifted off-screen -- otherwise the voice keeps
  // reading past what's visible and the listener loses their place. Skipped while Reader
  // Mode's own manual auto-scroll is running, since that's an explicit user choice.
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
  }, [autoScrollOn, speedIndex]);

  if (loading || chaptersLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.scrollContent}>
            <Skeleton style={styles.skeletonBackLink} />
            <Skeleton style={styles.skeletonTag} />
            <Skeleton style={styles.skeletonTitle} />
            <Skeleton style={styles.skeletonLine} />
            <Skeleton style={styles.skeletonLine} />
            <Skeleton style={styles.skeletonLineShort} />
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (notFound || !story) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centerFill}>
          <ThemedText type="smallBold">Story not found</ThemedText>
          <BackButton href="/(app)" label="Back to Home" />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (isArchiveLocked) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.topRow}>
            <BackButton href={{ pathname: '/story/[id]', params: { id } }} />
          </ThemedView>
          <ThemedView style={styles.centerFill}>
            <Ionicons name="lock-closed" size={32} color="#C01918" />
            <ThemedText type="smallBold" style={styles.archiveLockTitle}>
              This story is part of the Premium archive
            </ThemedText>
            <ThemedText type="small" style={styles.archiveLockBody}>
              Stories older than {FREE_ARCHIVE_WINDOW_DAYS} days are available to Premium members.
              Upgrade to unlock the full archive.
            </ThemedText>
            <Pressable style={styles.completeButton} onPress={() => router.push('/manage-subscription')}>
              <ThemedText style={styles.completeButtonText}>View Premium</ThemedText>
            </Pressable>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isLastChapter = !hasChapters || chapterIndex === chapters.length - 1;
  const isFirstChapter = chapterIndex === 0;
  const readerColors = readerModeActive ? Colors[readerTheme] : null;
  // A low-opacity red highlight reads fine on a light background but nearly disappears
  // against a dark one, so dark mode (whichever theme is actually driving the screen right
  // now -- Reader Mode's own or the app-wide one) gets a stronger, more opaque version.
  const isDarkNow = readerModeActive ? readerTheme === 'dark' : resolvedScheme === 'dark';
  // Re-bound to a const so it stays narrowed to non-null inside handleDownloadToggle below --
  // TS doesn't carry the `if (!story) return` narrowing above into nested function bodies.
  const currentStory = story;
  const isStoryDownloaded = downloads.some((d) => d.id === currentStory.id);

  function goToChapter(nextChapterNumber: number) {
    router.setParams({ chapter: String(nextChapterNumber) });
  }

  function handleListenToggle() {
    Haptics.selectionAsync();
    if (hasRecordedAudio) {
      if (playerStatus.playing) {
        player.pause();
      } else {
        player.play();
      }
    } else {
      tts.toggle();
    }
  }

  function handleReaderModeToggle() {
    if (!profile?.is_premium) {
      setShowPremiumLock(true);
      return;
    }
    Haptics.selectionAsync();
    setReaderModeActive((prev) => {
      if (prev) setAutoScrollOn(false);
      return !prev;
    });
  }

  async function handleDownloadToggle() {
    if (!profile?.is_premium) {
      setShowDownloadLock(true);
      return;
    }
    Haptics.selectionAsync();
    setDownloadBusy(true);
    if (isStoryDownloaded) {
      await removeDownload(currentStory.id);
    } else {
      await downloadStory(currentStory, chapters);
    }
    setDownloadBusy(false);
  }

  function adjustReaderFont(delta: number) {
    setReaderFontScale((prev) =>
      Math.round(Math.min(READER_FONT_MAX, Math.max(READER_FONT_MIN, prev + delta)) * 100) / 100
    );
  }

  function adjustSpeed(delta: number) {
    setSpeedIndex((prev) => Math.min(AUTO_SCROLL_SPEEDS.length - 1, Math.max(0, prev + delta)));
  }

  return (
    <ThemedView style={[styles.container, readerColors && { backgroundColor: readerColors.background }]}>
      <ThemedView style={styles.progressTrack}>
        <ThemedView style={[styles.progressFill, { width: `${progress?.progressPercent ?? 0}%` }]} />
      </ThemedView>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={[styles.topRow, readerColors && { backgroundColor: readerColors.background }]}>
          <BackButton href={{ pathname: '/story/[id]', params: { id } }} />
          <ThemedView style={[styles.topRowActions, readerColors && { backgroundColor: readerColors.background }]}>
            <Pressable onPress={handleListenToggle} hitSlop={8}>
              <Ionicons
                name={isListening ? (hasRecordedAudio ? 'pause' : 'stop') : 'headset-outline'}
                size={20}
                color={readerColors ? readerColors.text : '#C01918'}
              />
            </Pressable>
            <Pressable onPress={handleReaderModeToggle} hitSlop={8}>
              <Ionicons
                name={readerModeActive ? 'book' : 'book-outline'}
                size={20}
                color={readerColors ? readerColors.text : '#C01918'}
              />
            </Pressable>
            {Platform.OS !== 'web' && (
              <Pressable onPress={handleDownloadToggle} hitSlop={8} disabled={downloadBusy}>
                {downloadBusy ? (
                  <ActivityIndicator size="small" color={readerColors ? readerColors.text : '#C01918'} />
                ) : (
                  <Ionicons
                    name={isStoryDownloaded ? 'cloud-done' : 'cloud-download-outline'}
                    size={20}
                    color={readerColors ? readerColors.text : '#C01918'}
                  />
                )}
              </Pressable>
            )}
            <Pressable onPress={() => setReportingStory(true)} hitSlop={8}>
              <Ionicons name="flag-outline" size={18} color={readerColors ? readerColors.textSecondary : '#8a8a8e'} />
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleScrollViewLayout}
          scrollEventThrottle={200}
        >
          {hasChapters ? (
            <ThemedText type="small" style={styles.categoryTag}>
              Chapter {chapterIndex + 1} of {chapters.length}
              {currentChapter?.title ? ` · ${currentChapter.title}` : ''}
            </ThemedText>
          ) : (
            <ThemedText type="small" style={styles.categoryTag}>
              {categoryLabels[story.category] ?? story.category}
            </ThemedText>
          )}
          <ThemedText
            type="title"
            style={[
              styles.title,
              readerColors && { color: readerColors.text },
              readerModeActive && { fontSize: TITLE_FONT_SIZE * readerFontScale },
            ]}
          >
            {story.title}
          </ThemedText>
          <ThemedText
            onLayout={handleBodyLayout}
            style={[
              styles.body,
              readerColors && { color: readerColors.text, opacity: 1 },
              readerModeActive && { fontSize: BODY_FONT_SIZE * readerFontScale },
            ]}
          >
            {hasRecordedAudio
              ? bodyText
              : tts.sentences.map((sentence, i) => (
                  <Text
                    key={i}
                    style={
                      i === tts.currentIndex
                        ? isDarkNow
                          ? styles.activeSentenceDark
                          : styles.activeSentence
                        : undefined
                    }
                  >
                    {sentence.text}{' '}
                  </Text>
                ))}
          </ThemedText>

          {hasChapters && (
            <ThemedView style={styles.chapterNavRow}>
              <Pressable
                style={[styles.chapterNavButton, isFirstChapter && styles.chapterNavButtonDisabled]}
                onPress={() => goToChapter(chapterIndex)}
                disabled={isFirstChapter}
              >
                <Ionicons name="chevron-back" size={16} color={isFirstChapter ? '#5a5a5c' : '#C01918'} />
                <ThemedText
                  style={[styles.chapterNavText, isFirstChapter && styles.chapterNavTextDisabled]}
                >
                  Previous
                </ThemedText>
              </Pressable>
              {!isLastChapter && (
                <Pressable style={styles.chapterNavButton} onPress={() => goToChapter(chapterIndex + 2)}>
                  <ThemedText style={styles.chapterNavText}>Next Chapter</ThemedText>
                  <Ionicons name="chevron-forward" size={16} color="#C01918" />
                </Pressable>
              )}
            </ThemedView>
          )}

          {isLastChapter && (
            <>
              {story.reflection_question && (
                <>
                  <ThemedView type="backgroundElement" style={styles.calloutBox}>
                    <ThemedText type="smallBold">Reflect</ThemedText>
                    <ThemedText type="small">{story.reflection_question}</ThemedText>
                  </ThemedView>
                  <JournalComposer
                    storyId={id ?? ''}
                    storyTitle={story.title}
                    reflectionQuestion={story.reflection_question}
                  />
                </>
              )}
              {story.daily_lesson && (
                <ThemedView type="backgroundElement" style={styles.calloutBox}>
                  <ThemedText type="smallBold">Today&apos;s Lesson</ThemedText>
                  <ThemedText type="small">{story.daily_lesson}</ThemedText>
                </ThemedView>
              )}

              {progress?.completed ? (
                <ThemedView style={[styles.completedBadge, styles.completedBadgeRow]}>
                  <Ionicons name="checkmark-circle" size={18} color="#32b45a" />
                  <ThemedText style={styles.completedBadgeText}>Marked as Complete</ThemedText>
                </ThemedView>
              ) : (
                <Pressable style={styles.completeButton} onPress={markComplete}>
                  <ThemedText style={styles.completeButtonText}>Mark as Complete</ThemedText>
                </Pressable>
              )}

              <CommentsSection storyId={id ?? ''} />
            </>
          )}
        </ScrollView>

        {readerModeActive && (
          <ThemedView type="backgroundElement" style={styles.readerControls}>
            <ThemedView style={styles.readerControlRow}>
              <ThemedText type="small" style={styles.readerControlLabel}>
                Text size
              </ThemedText>
              <ThemedView style={styles.readerControlButtons}>
                <Pressable
                  style={styles.readerControlButton}
                  onPress={() => adjustReaderFont(-READER_FONT_STEP)}
                  disabled={readerFontScale <= READER_FONT_MIN}
                >
                  <ThemedText style={styles.readerControlButtonText}>A-</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.readerControlButton}
                  onPress={() => adjustReaderFont(READER_FONT_STEP)}
                  disabled={readerFontScale >= READER_FONT_MAX}
                >
                  <ThemedText style={styles.readerControlButtonText}>A+</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.readerControlRow}>
              <ThemedText type="small" style={styles.readerControlLabel}>
                Reader theme
              </ThemedText>
              <Pressable
                style={styles.readerControlButton}
                onPress={() => setReaderTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              >
                <Ionicons
                  name={readerTheme === 'light' ? 'sunny-outline' : 'moon-outline'}
                  size={16}
                  color={readerColors?.text}
                />
              </Pressable>
            </ThemedView>

            <ThemedView style={styles.readerControlRow}>
              <ThemedText type="small" style={styles.readerControlLabel}>
                Auto-scroll
              </ThemedText>
              <ThemedView style={styles.readerControlButtons}>
                <Pressable
                  style={styles.readerControlButton}
                  onPress={() => adjustSpeed(-1)}
                  disabled={speedIndex <= 0}
                >
                  <Ionicons name="remove" size={16} color={readerColors?.text} />
                </Pressable>
                <ThemedText type="small" style={styles.speedLabel}>
                  {speedIndex + 1}/{AUTO_SCROLL_SPEEDS.length}
                </ThemedText>
                <Pressable
                  style={styles.readerControlButton}
                  onPress={() => adjustSpeed(1)}
                  disabled={speedIndex >= AUTO_SCROLL_SPEEDS.length - 1}
                >
                  <Ionicons name="add" size={16} color={readerColors?.text} />
                </Pressable>
                <Pressable
                  style={[styles.readerControlButton, styles.autoScrollToggle]}
                  onPress={() => setAutoScrollOn((prev) => !prev)}
                >
                  <Ionicons name={autoScrollOn ? 'pause' : 'play'} size={16} color="#fff" />
                </Pressable>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}
      </SafeAreaView>

      <ReportModal
        visible={reportingStory}
        onClose={() => setReportingStory(false)}
        targetType="story"
        targetId={id ?? ''}
      />

      <PremiumLockModal
        visible={showPremiumLock}
        onClose={() => setShowPremiumLock(false)}
        title="Reader Mode is a premium feature"
        body="Auto-scroll, a dedicated reader theme, and font controls are part of premium. Upgrade to unlock them."
      />

      <PremiumLockModal
        visible={showDownloadLock}
        onClose={() => setShowDownloadLock(false)}
        title="Offline downloads are a premium feature"
        body="Save stories to read anytime, even without a signal. Upgrade to start downloading."
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  archiveLockTitle: { textAlign: 'center' },
  archiveLockBody: { textAlign: 'center', opacity: 0.7, paddingHorizontal: Spacing.four },
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  skeletonBackLink: { width: 60, height: 24, borderRadius: 4, marginBottom: Spacing.two },
  skeletonTag: { width: 100, height: 20, borderRadius: 4, marginTop: Spacing.two },
  skeletonTitle: { width: '70%', height: 31, borderRadius: 6 },
  skeletonLine: { width: '100%', height: 24, borderRadius: 4 },
  skeletonLineShort: { width: '60%', height: 24, borderRadius: 4 },
  progressTrack: { height: 3, backgroundColor: 'rgba(128,128,128,0.25)' },
  progressFill: { height: 3, backgroundColor: '#C01918' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    backgroundColor: 'transparent',
  },
  topRowActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, backgroundColor: 'transparent' },
  categoryTag: { color: '#C01918', fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: TITLE_FONT_SIZE, lineHeight: 31 },
  body: { fontSize: BODY_FONT_SIZE, lineHeight: 24, opacity: 0.9 },
  activeSentence: { backgroundColor: 'rgba(192,25,24,0.22)', fontWeight: '700' },
  activeSentenceDark: { backgroundColor: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: '700' },
  chapterNavRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.two },
  chapterNavButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chapterNavButtonDisabled: { opacity: 0.4 },
  chapterNavText: { color: '#C01918', fontWeight: '600' },
  chapterNavTextDisabled: { color: '#5a5a5c' },
  calloutBox: { padding: Spacing.three, borderRadius: 12, gap: 4 },
  completeButton: {
    marginTop: Spacing.two,
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  completeButtonText: { color: '#fff', fontWeight: '600' },
  completedBadge: {
    marginTop: Spacing.two,
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    backgroundColor: 'rgba(50,180,90,0.15)',
  },
  completedBadgeRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  completedBadgeText: { color: '#32b45a', fontWeight: '600' },
  readerControls: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  readerControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  readerControlLabel: { opacity: 0.7 },
  readerControlButtons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  readerControlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  readerControlButtonText: { fontSize: 13, fontWeight: '600' },
  autoScrollToggle: { backgroundColor: '#C01918' },
  speedLabel: { width: 28, textAlign: 'center', opacity: 0.7 },
});
