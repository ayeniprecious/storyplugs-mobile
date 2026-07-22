import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useProfile } from '@/context/profile-context';
import { useThemePrefs } from '@/context/theme-prefs-context';
import { useAppSettings } from '@/hooks/use-app-settings';
import { isDownloaded, readDownloadedContent, useDownloads } from '@/hooks/use-downloads';
import { useFavorite } from '@/hooks/use-favorite';
import { useRecordActivity } from '@/hooks/use-record-activity';
import { useStoryChapters } from '@/hooks/use-story-chapters';
import { useStoryProgress } from '@/hooks/use-story-progress';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { useTheme } from '@/hooks/use-theme';
import type { Story, StoryChapter } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

const BODY_FONT_SIZE = 16;
const TITLE_FONT_SIZE = 28;

// Three fixed presets (chip picker) instead of a continuous +/- scale --
// matches the "Aa / Aa / Aa" three-size picker in the reference design.
const FONT_SCALE_OPTIONS = [0.9, 1.05, 1.3];
const SPACING_OPTIONS = [1.0, 1.2, 1.4];

// Reader Mode's own palette set, deliberately independent of the app-wide
// Appearance settings -- sepia has no equivalent in the global theme, so it's
// defined locally with the same shape as Colors.light/dark.
const SEPIA_COLORS = {
  text: '#3b2f22',
  background: '#F4ECD8',
  backgroundElement: '#ECE0C4',
  backgroundSelected: '#E3D5B0',
  textSecondary: '#6b5c47',
  border: '#ddcfb0',
  placeholder: '#8a7a5f',
  cardAshSolid: '#ECE0C4',
} as const;

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
  // True once load() has determined whether this story is downloaded. Gating
  // the network chapters fetch on this (rather than just `offlineChapters`)
  // matters because an empty offlineChapters array (non-chaptered stories) is
  // still truthy in JS, and because both effects otherwise start on the same
  // render -- without this flag, useStoryChapters could fire its network
  // fetch before the async isDownloaded() check below has resolved.
  const [downloadChecked, setDownloadChecked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollDimsRef = useRef({ contentHeight: 0, viewportHeight: 0 });
  const autoScrollYRef = useRef(0);
  const bodyBlockRef = useRef({ y: 0, height: 0 });

  const { user } = useAuth();
  const { profile } = useProfile();
  const { settings } = useAppSettings();
  const appName = settings.app_name || 'StoryPlugs';
  const theme = useTheme();
  const { downloads, downloadStory, removeDownload } = useDownloads();
  // Free accounts can't read chapter content for stories outside the archive
  // window -- skip the fetch entirely by passing an empty id (useStoryChapters
  // treats that as "nothing to load"). See isArchiveLocked below for the
  // full-screen lock state this backs. Already-downloaded stories also skip
  // the network fetch -- offlineChapters, once set, is the source of truth.
  const isArchiveLocked =
    !!story?.published_at && !profile?.is_premium && isOutsideFreeArchiveWindow(story.published_at);
  const { chapters: networkChapters, loading: networkChaptersLoading } = useStoryChapters(
    isArchiveLocked || offlineChapters || !downloadChecked ? '' : id ?? ''
  );
  const chapters = offlineChapters ?? networkChapters;
  const chaptersLoading = offlineChapters ? false : !downloadChecked || networkChaptersLoading;
  const { progress, markComplete, updateProgressPercent } = useStoryProgress(id ?? '');
  const { labels: categoryLabels } = useCategories();
  const { resolvedScheme } = useThemePrefs();
  const { isFavorited, toggle: toggleFavorite } = useFavorite(id ?? '');
  const [reportingStory, setReportingStory] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [showDownloadLock, setShowDownloadLock] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chapterListOpen, setChapterListOpen] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  useRecordActivity();

  // Reader Mode -- premium-gated. Its theme/font settings are deliberately independent of
  // the app-wide Appearance settings, since a reader may want a different look while
  // actually reading than they use for the rest of the app.
  const [readerModeActive, setReaderModeActive] = useState(false);
  const [showPremiumLock, setShowPremiumLock] = useState(false);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>(resolvedScheme);
  const [fontScaleIndex, setFontScaleIndex] = useState(1);
  const [spacingIndex, setSpacingIndex] = useState(1);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [autoScrollOn, setAutoScrollOn] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2);
  const readerFontScale = FONT_SCALE_OPTIONS[fontScaleIndex];
  const spacingMultiplier = SPACING_OPTIONS[spacingIndex];

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

      // Known not-downloaded (or the local copy was unreadable) -- let
      // useStoryChapters' network fetch start now, in parallel with the
      // story fetch below, rather than waiting on it.
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

  // Real comment count for the action row -- independent of CommentsSection's
  // own fetch (which only surfaces its count inside its own heading), kept
  // genuine rather than inventing a number.
  useEffect(() => {
    let cancelled = false;
    async function loadCount() {
      if (!id) return;
      const { count } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('story_id', id);
      if (!cancelled) setCommentCount(count ?? 0);
    }
    loadCount();
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
  const readerColors = readerModeActive ? (readerTheme === 'sepia' ? SEPIA_COLORS : Colors[readerTheme]) : null;
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

  function handleFavoriteToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite();
  }

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const excerpt = currentStory.body.length > 140 ? `${currentStory.body.slice(0, 140)}...` : currentStory.body;
    const url = Linking.createURL(`story/${currentStory.id}`);
    try {
      const result = await Share.share({
        message: `"${currentStory.title}" — a story from ${appName}.\n\n${excerpt}\n\n${url}`,
        url,
        title: currentStory.title,
      });
      if (result.action === Share.sharedAction && user?.id) {
        const platform = (result as { activityType?: string }).activityType || Platform.OS;
        await supabase.from('story_shares').insert({ user_id: user.id, story_id: currentStory.id, platform });
      }
    } catch {
      // user cancelled or the share sheet is unavailable on this platform
    }
  }

  function scrollToComments() {
    scrollRef.current?.scrollToEnd({ animated: true });
  }

  function handleReaderModeMenuPress() {
    setMenuOpen(false);
    handleReaderModeToggle();
  }

  function handleDownloadMenuPress() {
    setMenuOpen(false);
    handleDownloadToggle();
  }

  function handleReportMenuPress() {
    setMenuOpen(false);
    setReportingStory(true);
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
          <ThemedView style={[styles.topRowCenter, readerColors && { backgroundColor: readerColors.background }]}>
            <ThemedText
              type="smallBold"
              numberOfLines={1}
              style={[styles.topRowTitle, readerColors && { color: readerColors.text }]}
            >
              {story.title}
            </ThemedText>
            {hasChapters && (
              <ThemedText
                type="small"
                style={[styles.topRowSubtitle, readerColors && { color: readerColors.textSecondary }]}
              >
                Part {chapterIndex + 1} of {chapters.length}
              </ThemedText>
            )}
          </ThemedView>
          <ThemedView style={[styles.topRowActions, readerColors && { backgroundColor: readerColors.background }]}>
            <Pressable onPress={handleFavoriteToggle} hitSlop={8}>
              <Ionicons
                name={isFavorited ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isFavorited ? '#C01918' : readerColors ? readerColors.text : '#C01918'}
              />
            </Pressable>
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={20} color={readerColors ? readerColors.text : '#C01918'} />
            </Pressable>
          </ThemedView>
        </ThemedView>

        {profile?.is_premium ? (
          <Pressable style={styles.statusPill} onPress={() => router.push('/manage-subscription')}>
            <Ionicons name="star" size={12} color="#C01918" />
            <ThemedText style={styles.statusPillText}>PREMIUM</ThemedText>
            <ThemedText type="small" style={styles.statusPillSub}>
              You have unlimited access
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color="rgba(128,128,128,0.6)" />
          </Pressable>
        ) : (
          <Pressable style={styles.freeBanner} onPress={() => router.push('/manage-subscription')}>
            <Ionicons name="sparkles-outline" size={13} color="#C01918" />
            <ThemedText type="small" style={styles.freeBannerText}>
              Unlock custom fonts, themes &amp; narration with Premium
            </ThemedText>
          </Pressable>
        )}

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleScrollViewLayout}
          scrollEventThrottle={200}
        >
          {hasChapters ? (
            <ThemedText type="small" style={[styles.categoryTag, readerColors && { color: '#C01918' }]}>
              Part {chapterIndex + 1}
            </ThemedText>
          ) : (
            <ThemedText type="small" style={[styles.categoryTag, readerColors && { color: '#C01918' }]}>
              {categoryLabels[story.category] ?? story.category}
            </ThemedText>
          )}
          <ThemedText
            type="title"
            style={[
              styles.title,
              readerColors && { color: readerColors.text },
              readerModeActive && {
                fontSize: TITLE_FONT_SIZE * readerFontScale,
                lineHeight: 33 * readerFontScale,
              },
            ]}
          >
            {hasChapters ? currentChapter?.title || `Part ${chapterIndex + 1}` : story.title}
          </ThemedText>
          <ThemedText
            onLayout={handleBodyLayout}
            style={[
              styles.body,
              readerColors && { color: readerColors.text, opacity: 1 },
              readerModeActive && {
                fontSize: BODY_FONT_SIZE * readerFontScale,
                lineHeight: 24 * readerFontScale * spacingMultiplier,
              },
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

          {isLastChapter && (
            <>
              {story.reflection_question && (
                <>
                  <ThemedView style={styles.calloutBox}>
                    <Ionicons name="sparkles-outline" size={20} color="#8a8a8e" style={styles.calloutGlyph} />
                    <ThemedView style={styles.calloutBody}>
                      <ThemedText type="small" style={styles.calloutLabel}>
                        Reflect
                      </ThemedText>
                      <ThemedText style={styles.calloutText}>{story.reflection_question}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <JournalComposer
                    storyId={id ?? ''}
                    storyTitle={story.title}
                    reflectionQuestion={story.reflection_question}
                  />
                </>
              )}
              {story.daily_lesson && (
                <ThemedView style={styles.calloutBox}>
                  <Ionicons name="bulb-outline" size={20} color="#8a8a8e" style={styles.calloutGlyph} />
                  <ThemedView style={styles.calloutBody}>
                    <ThemedText type="small" style={styles.calloutLabel}>
                      Today&apos;s Lesson
                    </ThemedText>
                    <ThemedText style={styles.calloutText}>{story.daily_lesson}</ThemedText>
                  </ThemedView>
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
            </>
          )}

          {/* Every chapter gets the same shared, story-wide comment thread at
              its bottom -- not just the last one -- so readers can join the
              conversation without having to finish the whole story first. */}
          <CommentsSection storyId={id ?? ''} />
        </ScrollView>

        <ThemedView style={[styles.actionRow, readerColors && { backgroundColor: readerColors.background }]}>
          <Pressable style={styles.actionButton} onPress={handleFavoriteToggle} hitSlop={8}>
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorited ? '#C01918' : readerColors ? readerColors.text : '#8a8a8e'}
            />
            <ThemedText type="small" style={styles.actionButtonText}>
              {isFavorited ? 'Saved' : 'Save'}
            </ThemedText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={scrollToComments} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={19} color={readerColors ? readerColors.text : '#8a8a8e'} />
            <ThemedText type="small" style={styles.actionButtonText}>
              {commentCount !== null ? `${commentCount} Comments` : 'Comments'}
            </ThemedText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleShare} hitSlop={8}>
            <Ionicons name="share-outline" size={19} color={readerColors ? readerColors.text : '#8a8a8e'} />
            <ThemedText type="small" style={styles.actionButtonText}>
              Share
            </ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={[styles.playbackBar, readerColors && { backgroundColor: readerColors.background }]}>
          <Pressable onPress={() => hasChapters && setChapterListOpen(true)} hitSlop={8} disabled={!hasChapters}>
            <Ionicons
              name="list-outline"
              size={20}
              color={hasChapters ? (readerColors ? readerColors.text : '#C01918') : '#5a5a5c'}
            />
          </Pressable>
          {hasChapters && (
            <Pressable onPress={() => goToChapter(chapterIndex)} disabled={isFirstChapter} hitSlop={8}>
              <Ionicons
                name="play-skip-back"
                size={18}
                color={isFirstChapter ? '#5a5a5c' : readerColors ? readerColors.text : '#C01918'}
              />
            </Pressable>
          )}
          <Pressable onPress={handleListenToggle} style={styles.playButton} hitSlop={8}>
            <Ionicons name={isListening ? (hasRecordedAudio ? 'pause' : 'stop') : 'play'} size={20} color="#fff" />
          </Pressable>
          {hasChapters && (
            <Pressable onPress={() => goToChapter(chapterIndex + 2)} disabled={isLastChapter} hitSlop={8}>
              <Ionicons
                name="play-skip-forward"
                size={18}
                color={isLastChapter ? '#5a5a5c' : readerColors ? readerColors.text : '#C01918'}
              />
            </Pressable>
          )}
          <ThemedText
            type="small"
            style={[styles.playbackPercent, readerColors && { color: readerColors.textSecondary }]}
          >
            {progress?.progressPercent ?? 0}%
          </ThemedText>
        </ThemedView>

        {readerModeActive && (
          <ThemedView type="cardAshSolid" style={styles.readerPanel}>
            <ThemedText type="smallBold" style={styles.readerPanelHeading}>
              Font &amp; Appearance
            </ThemedText>

            <ThemedText type="small" style={styles.readerPanelLabel}>
              Text
            </ThemedText>
            <ThemedView style={styles.chipRow}>
              {FONT_SCALE_OPTIONS.map((scale, i) => (
                <Pressable
                  key={scale}
                  style={[styles.fontChip, fontScaleIndex === i && styles.fontChipSelected]}
                  onPress={() => setFontScaleIndex(i)}
                >
                  <ThemedText
                    style={[
                      styles.fontChipText,
                      { fontSize: 13 + i * 4 },
                      fontScaleIndex === i && styles.fontChipTextSelected,
                    ]}
                  >
                    Aa
                  </ThemedText>
                </Pressable>
              ))}
            </ThemedView>

            <ThemedText type="small" style={styles.readerPanelLabel}>
              Theme
            </ThemedText>
            <ThemedView style={styles.chipRow}>
              {(['light', 'sepia', 'dark'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.themeSwatch,
                    { backgroundColor: t === 'light' ? '#ffffff' : t === 'sepia' ? '#F4ECD8' : '#141414' },
                    readerTheme === t && styles.themeSwatchSelected,
                  ]}
                  onPress={() => setReaderTheme(t)}
                />
              ))}
            </ThemedView>

            <ThemedText type="small" style={styles.readerPanelLabel}>
              Spacing
            </ThemedText>
            <ThemedView style={styles.chipRow}>
              {SPACING_OPTIONS.map((multiplier, i) => (
                <Pressable
                  key={multiplier}
                  style={[styles.spacingChip, spacingIndex === i && styles.fontChipSelected]}
                  onPress={() => setSpacingIndex(i)}
                >
                  <Ionicons
                    name="reorder-four-outline"
                    size={16}
                    color={spacingIndex === i ? '#fff' : (readerColors?.text ?? theme.text)}
                  />
                </Pressable>
              ))}
            </ThemedView>

            <Pressable style={styles.moreSettingsButton} onPress={() => setShowMoreSettings((prev) => !prev)}>
              <ThemedText style={styles.moreSettingsText}>
                {showMoreSettings ? 'Hide' : 'More'} Settings
              </ThemedText>
              <Ionicons name={showMoreSettings ? 'chevron-up' : 'chevron-down'} size={14} color="#C01918" />
            </Pressable>

            {showMoreSettings && (
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
            )}
          </ThemedView>
        )}
      </SafeAreaView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <ThemedView type="cardAshSolid" style={styles.menuSheet} onStartShouldSetResponder={() => true}>
            <Pressable style={styles.menuItem} onPress={handleReaderModeMenuPress}>
              <Ionicons name="text-outline" size={18} color={theme.text} />
              <ThemedText style={styles.menuItemText}>Font &amp; Appearance</ThemedText>
              {!profile?.is_premium && <Ionicons name="lock-closed" size={13} color={theme.placeholder} />}
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDownloadMenuPress} disabled={downloadBusy}>
              {downloadBusy ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <Ionicons
                  name={isStoryDownloaded ? 'cloud-done' : 'cloud-download-outline'}
                  size={18}
                  color={theme.text}
                />
              )}
              <ThemedText style={styles.menuItemText}>
                {isStoryDownloaded ? 'Remove Download' : 'Download Offline'}
              </ThemedText>
              {!profile?.is_premium && <Ionicons name="lock-closed" size={13} color={theme.placeholder} />}
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleReportMenuPress}>
              <Ionicons name="flag-outline" size={18} color={theme.text} />
              <ThemedText style={styles.menuItemText}>Report</ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Modal>

      <Modal
        visible={chapterListOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setChapterListOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setChapterListOpen(false)}>
          <ThemedView type="cardAshSolid" style={styles.menuSheet} onStartShouldSetResponder={() => true}>
            <ThemedText type="smallBold" style={styles.chapterListHeading}>
              Chapters
            </ThemedText>
            <ScrollView style={styles.chapterListScroll}>
              {chapters.map((c, i) => (
                <Pressable
                  key={c.id}
                  style={styles.menuItem}
                  onPress={() => {
                    setChapterListOpen(false);
                    goToChapter(i + 1);
                  }}
                >
                  <ThemedView style={[styles.chapterListBadge, i === chapterIndex && styles.chapterListBadgeActive]}>
                    <ThemedText
                      style={[styles.chapterListBadgeText, i === chapterIndex && styles.chapterListBadgeTextActive]}
                    >
                      {i + 1}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText
                    style={[styles.menuItemText, i === chapterIndex && styles.chapterListActiveText]}
                    numberOfLines={1}
                  >
                    {c.title || `Chapter ${i + 1}`}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>

      <ReportModal
        visible={reportingStory}
        onClose={() => setReportingStory(false)}
        targetType="story"
        targetId={id ?? ''}
      />

      <PremiumLockModal
        visible={showPremiumLock}
        onClose={() => setShowPremiumLock(false)}
        title="Font & Appearance is a premium feature"
        body="Custom text size, reader themes, spacing, and auto-scroll are part of premium. Upgrade to unlock them."
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    gap: Spacing.two,
    paddingBottom: Spacing.four,
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
  topRowCenter: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.two, backgroundColor: 'transparent' },
  topRowTitle: { fontSize: 15, textAlign: 'center' },
  topRowSubtitle: { opacity: 0.6, fontSize: 12, textAlign: 'center' },
  topRowActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, backgroundColor: 'transparent' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.two + 4,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: 10,
    backgroundColor: 'rgba(192,25,24,0.1)',
  },
  statusPillText: { color: '#C01918', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  statusPillSub: { flex: 1, opacity: 0.75 },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.two + 4,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: 10,
    backgroundColor: 'rgba(192,25,24,0.1)',
  },
  freeBannerText: { flex: 1, color: '#C01918', fontWeight: '500' },
  categoryTag: { color: '#C01918', fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: TITLE_FONT_SIZE, lineHeight: 33, fontWeight: '800' },
  body: { fontSize: BODY_FONT_SIZE, lineHeight: 24, opacity: 0.9 },
  activeSentence: { backgroundColor: 'rgba(192,25,24,0.22)', fontWeight: '700' },
  activeSentenceDark: { backgroundColor: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: '700' },
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#C01918',
    padding: Spacing.three,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  calloutGlyph: { marginTop: 2 },
  calloutBody: { flex: 1, gap: 4, backgroundColor: 'transparent' },
  calloutLabel: { color: '#C01918', fontSize: 11, textTransform: 'uppercase' },
  calloutText: { fontSize: 15, lineHeight: 22, opacity: 0.9 },
  completeButton: {
    marginTop: Spacing.two,
    backgroundColor: '#C01918',
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
  actionButtonText: { opacity: 0.75 },
  playbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C01918',
  },
  playbackPercent: { marginLeft: 'auto', opacity: 0.6, fontVariant: ['tabular-nums'] },
  readerPanel: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  readerPanelHeading: { fontSize: 15 },
  readerPanelLabel: { opacity: 0.6, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: 'transparent' },
  fontChip: {
    width: 44,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  fontChipSelected: { backgroundColor: '#C01918' },
  fontChipText: { fontWeight: '700' },
  fontChipTextSelected: { color: '#fff' },
  themeSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  themeSwatchSelected: { borderWidth: 2, borderColor: '#C01918' },
  spacingChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  moreSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.one,
    paddingVertical: Spacing.two - 2,
  },
  moreSettingsText: { color: '#C01918', fontWeight: '600' },
  readerControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginTop: Spacing.one,
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
  autoScrollToggle: { backgroundColor: '#C01918' },
  speedLabel: { width: 28, textAlign: 'center', opacity: 0.7 },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  menuSheet: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '70%',
    borderRadius: 16,
    padding: Spacing.four,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingVertical: Spacing.three,
  },
  menuItemText: { fontSize: 16, flex: 1 },
  chapterListHeading: { fontSize: 17, marginBottom: Spacing.two },
  chapterListScroll: { maxHeight: 380 },
  chapterListBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  chapterListBadgeActive: { backgroundColor: 'rgba(192,25,24,0.14)' },
  chapterListBadgeText: { fontSize: 12, fontWeight: '700' },
  chapterListBadgeTextActive: { color: '#C01918' },
  chapterListActiveText: { color: '#C01918', fontWeight: '700' },
});
