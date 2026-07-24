import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
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
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useProfile } from '@/context/profile-context';
import { useThemePrefs } from '@/context/theme-prefs-context';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useDownloads } from '@/hooks/use-downloads';
import { useFavorite } from '@/hooks/use-favorite';
import { useRecordActivity } from '@/hooks/use-record-activity';
import { useStoryReader } from '@/hooks/use-story-reader';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

const BODY_FONT_SIZE = 16;
const TITLE_FONT_SIZE = 28;

export default function StoryRead() {
  const { id, chapter } = useLocalSearchParams<{ id: string; chapter?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const reader = useStoryReader(id, chapter, scrollRef);
  const {
    story,
    loading,
    notFound,
    chapters,
    chaptersLoading,
    hasChapters,
    chapterIndex,
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
    goToChapter,
    handleListenToggle,
  } = reader;

  const { user } = useAuth();
  const { profile } = useProfile();
  const { settings } = useAppSettings();
  const appName = settings.app_name || 'StoryPlugs';
  const theme = useTheme();
  const { downloads, downloadStory, removeDownload } = useDownloads();
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
  const isDarkNow = resolvedScheme === 'dark';
  // Re-bound to a const so it stays narrowed to non-null inside handleDownloadToggle below --
  // TS doesn't carry the `if (!story) return` narrowing above into nested function bodies.
  const currentStory = story;
  const isStoryDownloaded = downloads.some((d) => d.id === currentStory.id);

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

  // Reader Mode is a genuinely separate screen -- entering it navigates away
  // from this page entirely rather than toggling a same-page style variant.
  function enterReaderMode() {
    router.push({
      pathname: '/story/[id]/reader',
      params: { id: id ?? '', chapter: hasChapters ? String(chapterIndex + 1) : undefined },
    });
  }

  function handleDownloadMenuPress() {
    setMenuOpen(false);
    handleDownloadToggle();
  }

  function handleReportMenuPress() {
    setMenuOpen(false);
    setReportingStory(true);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.progressTrack}>
        <ThemedView style={[styles.progressFill, { width: `${progress?.progressPercent ?? 0}%` }]} />
      </ThemedView>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.topRow}>
          <BackButton href={{ pathname: '/story/[id]', params: { id } }} />
          <ThemedView style={styles.topRowCenter}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.topRowTitle}>
              {story.title}
            </ThemedText>
            {hasChapters && (
              <ThemedText type="small" style={styles.topRowSubtitle}>
                Part {chapterIndex + 1} of {chapters.length}
              </ThemedText>
            )}
          </ThemedView>
          <ThemedView style={styles.topRowActions}>
            <Pressable onPress={handleFavoriteToggle} hitSlop={8}>
              <Ionicons name={isFavorited ? 'bookmark' : 'bookmark-outline'} size={20} color="#C01918" />
            </Pressable>
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#C01918" />
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.readerModeBar}>
          <ThemedView style={styles.readerModeBarLabel}>
            <Ionicons name="book-outline" size={16} color={theme.text} />
            <ThemedText type="small" style={styles.readerModeBarText}>
              Reader Mode
            </ThemedText>
          </ThemedView>
          <Switch
            value={false}
            onValueChange={(value) => {
              if (value) enterReaderMode();
            }}
            trackColor={{ false: 'rgba(128,128,128,0.4)', true: '#C01918' }}
            thumbColor="#fff"
          />
        </ThemedView>

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
            <ThemedText type="small" style={styles.categoryTag}>
              Part {chapterIndex + 1}
            </ThemedText>
          ) : (
            <ThemedText type="small" style={styles.categoryTag}>
              {categoryLabels[story.category] ?? story.category}
            </ThemedText>
          )}
          <ThemedText type="title" style={styles.title}>
            {hasChapters ? currentChapter?.title || `Part ${chapterIndex + 1}` : story.title}
          </ThemedText>
          <ThemedText onLayout={handleBodyLayout} style={styles.body}>
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

        <ThemedView style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={handleFavoriteToggle} hitSlop={8}>
            <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={20} color={isFavorited ? '#C01918' : '#8a8a8e'} />
            <ThemedText type="small" style={styles.actionButtonText}>
              {isFavorited ? 'Saved' : 'Save'}
            </ThemedText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={scrollToComments} hitSlop={8}>
            <Ionicons name="chatbubble-outline" size={19} color="#8a8a8e" />
            <ThemedText type="small" style={styles.actionButtonText}>
              {commentCount !== null ? `${commentCount} Comments` : 'Comments'}
            </ThemedText>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleShare} hitSlop={8}>
            <Ionicons name="share-outline" size={19} color="#8a8a8e" />
            <ThemedText type="small" style={styles.actionButtonText}>
              Share
            </ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.playbackBar}>
          <Pressable onPress={() => hasChapters && setChapterListOpen(true)} hitSlop={8} disabled={!hasChapters}>
            <Ionicons name="list-outline" size={20} color={hasChapters ? '#C01918' : '#5a5a5c'} />
          </Pressable>
          {hasChapters && (
            <Pressable onPress={() => goToChapter(chapterIndex)} disabled={isFirstChapter} hitSlop={8}>
              <Ionicons name="play-skip-back" size={18} color={isFirstChapter ? '#5a5a5c' : '#C01918'} />
            </Pressable>
          )}
          <Pressable onPress={handleListenToggle} style={styles.playButton} hitSlop={8}>
            <Ionicons name={isListening ? (hasRecordedAudio ? 'pause' : 'stop') : 'play'} size={20} color="#fff" />
          </Pressable>
          {hasChapters && (
            <Pressable onPress={() => goToChapter(chapterIndex + 2)} disabled={isLastChapter} hitSlop={8}>
              <Ionicons name="play-skip-forward" size={18} color={isLastChapter ? '#5a5a5c' : '#C01918'} />
            </Pressable>
          )}
          <ThemedText type="small" style={styles.playbackPercent}>
            {progress?.progressPercent ?? 0}%
          </ThemedText>
        </ThemedView>
      </SafeAreaView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <ThemedView type="cardAshSolid" style={styles.menuSheet} onStartShouldSetResponder={() => true}>
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
  readerModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.two - 2,
    marginHorizontal: Spacing.two + 4,
    marginBottom: Spacing.two,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  readerModeBarLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' },
  readerModeBarText: { fontWeight: '600' },
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
