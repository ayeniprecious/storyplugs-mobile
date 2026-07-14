import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddToFolderModal } from '@/components/add-to-folder-modal';
import { BackButton } from '@/components/back-button';
import { CategoryRow } from '@/components/category-row';
import { CommentsSection } from '@/components/comments-section';
import { ReportModal } from '@/components/report-modal';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useAppSettings } from '@/hooks/use-app-settings';
import { isDownloaded, readDownloadedContent } from '@/hooks/use-downloads';
import { useFavorite } from '@/hooks/use-favorite';
import { useStoryChapters } from '@/hooks/use-story-chapters';
import { useTheme } from '@/hooks/use-theme';
import type { Story, StoryChapter } from '@/lib/database.types';
import { estimateReadMinutes } from '@/lib/read-time';
import { supabase } from '@/lib/supabase';

interface PreviewProgress {
  completed: boolean;
  progressPercent: number;
}

const EXCERPT_LINE_HEIGHT = 24;
const EXCERPT_COLLAPSED_HEIGHT = EXCERPT_LINE_HEIGHT * 4;

export default function StoryPreview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { settings } = useAppSettings();
  const appName = settings.app_name || 'StoryPlugs';
  const theme = useTheme();
  const [story, setStory] = useState<Story | null>(null);
  const [similar, setSimilar] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [previewProgress, setPreviewProgress] = useState<PreviewProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [excerptExpanded, setExcerptExpanded] = useState(false);
  const [excerptOverflows, setExcerptOverflows] = useState(false);
  const [addingToFolder, setAddingToFolder] = useState(false);
  const [reporting, setReporting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { isFavorited, toggle: toggleFavorite } = useFavorite(id ?? '');
  const { labels: categoryLabels } = useCategories();
  // Set only when this story is being read from its on-disk download rather
  // than the network -- mirrors read.tsx's exact pattern, including the
  // downloadChecked gate: an empty offlineChapters array (non-chaptered
  // stories) is still truthy, and both this effect and useStoryChapters' own
  // effect fire on the same mount, so gating on offlineChapters alone would
  // let a redundant network fetch slip through before the async
  // isDownloaded() check below resolves.
  const [offlineChapters, setOfflineChapters] = useState<StoryChapter[] | null>(null);
  const [downloadChecked, setDownloadChecked] = useState(false);
  const { chapters: networkChapters, loading: networkChaptersLoading } = useStoryChapters(
    offlineChapters || !downloadChecked ? '' : id ?? ''
  );
  const chapters = offlineChapters ?? networkChapters;
  const chaptersLoading = offlineChapters ? false : !downloadChecked || networkChaptersLoading;

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
          setSimilar([]);
          setDownloadChecked(true);
          setLoading(false);
          return;
        }
      }

      if (!cancelled) setDownloadChecked(true);
      setOfflineChapters(null);

      // stories_with_tags over stories -- same RLS, just adds each story's
      // tag list so the preview's genre-pill row can show real tags instead
      // of only the single category.
      const { data, error } = await supabase
        .from('stories_with_tags')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setStory(data as Story);

      const { data: similarData } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'published')
        .eq('category', data.category)
        .neq('id', data.id)
        .limit(6);

      if (!cancelled) {
        setSimilar((similarData as Story[]) ?? []);
        setLoading(false);
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Belt-and-suspenders: the loading skeleton (rendered in a separate branch
  // below, with no ScrollView) already forces a fresh ScrollView mount on
  // every id change in practice, but this guarantees it regardless of timing.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      if (!user?.id || !id) {
        setProgressLoading(false);
        return;
      }
      setProgressLoading(true);
      const { data } = await supabase
        .from('story_views')
        .select('completed, progress_percent')
        .eq('user_id', user.id)
        .eq('story_id', id)
        .maybeSingle();

      if (!cancelled) {
        setPreviewProgress(
          data ? { completed: data.completed, progressPercent: data.progress_percent } : null
        );
        setProgressLoading(false);
      }
    }
    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [user?.id, id]);

  async function handleShare() {
    if (!story) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await Share.share({
        message: `"${story.title}" — a story from ${appName}.\n\n${story.body.slice(0, 140)}...`,
        title: story.title,
      });
      if (result.action === Share.sharedAction && user?.id) {
        const platform = (result as { activityType?: string }).activityType || Platform.OS;
        await supabase.from('story_shares').insert({ user_id: user.id, story_id: story.id, platform });
      }
    } catch {
      // user cancelled or share sheet unavailable on this platform — nothing to recover from
    }
  }

  function handleFavoriteToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite();
  }

  function goToChapter(chapterNumber?: number) {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/story/[id]/read',
      params: chapterNumber ? { id, chapter: String(chapterNumber) } : { id },
    });
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)');
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.scrollContent}>
            <Skeleton style={styles.skeletonBackLink} />
            <ThemedView style={styles.skeletonHeaderRow}>
              <Skeleton style={styles.skeletonCover} />
              <ThemedView style={styles.skeletonHeaderInfo}>
                <Skeleton style={styles.skeletonTitle} />
                <Skeleton style={styles.skeletonLineShort} />
                <Skeleton style={styles.skeletonTag} />
              </ThemedView>
            </ThemedView>
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

  const completed = previewProgress?.completed ?? false;
  const percent = previewProgress?.progressPercent ?? 0;
  const started = previewProgress !== null && percent > 0 && !completed;
  const hasChapters = chapters.length > 0;

  let ctaLabel = 'Read Story';
  if (completed) ctaLabel = 'Read Again';
  else if (started) ctaLabel = 'Continue Reading';

  let ctaSubtitle: string | null = null;
  if (hasChapters) {
    if (started) {
      const estimatedChapter = Math.min(chapters.length, Math.max(1, Math.round((percent / 100) * chapters.length)));
      ctaSubtitle = `Chapter ${estimatedChapter} of ${chapters.length}`;
    } else {
      ctaSubtitle = `${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`;
    }
  } else if (started) {
    ctaSubtitle = `${percent}% read`;
  }

  const readMinutes = estimateReadMinutes(story.body);
  const updatedLabel = new Date(story.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const statusLabel = completed ? 'Completed' : started ? 'In Progress' : 'Not Started';
  const statusIcon = completed ? 'checkmark-circle' : started ? 'time-outline' : 'ellipse-outline';
  const statusColor = completed ? '#32b45a' : started ? '#C01918' : theme.placeholder;
  const tags = (story.tags ?? []).filter((tag) => tag !== story.category).slice(0, 3);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color="#C01918" />
          </Pressable>
          <ThemedView style={styles.headerActions}>
            <Pressable onPress={() => setAddingToFolder(true)} hitSlop={8} accessibilityLabel="Add to folder">
              <Ionicons name="folder-outline" size={22} color={theme.text} />
            </Pressable>
            <Pressable onPress={() => setReporting(true)} hitSlop={8} accessibilityLabel="More options">
              <Ionicons name="ellipsis-horizontal" size={22} color={theme.text} />
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.headerRow}>
            {story.image_url && (
              <Image source={{ uri: story.image_url }} style={styles.cover} contentFit="cover" />
            )}
            <ThemedView style={styles.headerInfo}>
              <ThemedText type="title" style={styles.title} numberOfLines={4}>
                {story.title}
              </ThemedText>
              <ThemedView style={styles.brandRow}>
                <Image
                  source={require('@/assets/images/logo-mark.png')}
                  style={styles.brandLogo}
                  contentFit="contain"
                />
                <ThemedText type="small" style={styles.brandName} numberOfLines={1}>
                  {appName}
                </ThemedText>
                <Ionicons name="checkmark-circle" size={13} color="#C01918" />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.tagRow}>
            <ThemedView style={styles.tagPill}>
              <ThemedText type="small" style={styles.tagPillText}>
                {categoryLabels[story.category] ?? story.category}
              </ThemedText>
            </ThemedView>
            {tags.map((tag) => (
              <ThemedView key={tag} style={styles.tagPill}>
                <ThemedText type="small" style={styles.tagPillText}>
                  {tag}
                </ThemedText>
              </ThemedView>
            ))}
            {story.is_mature && (
              <ThemedView style={styles.matureTagPill}>
                <MaterialIcons name="explicit" size={13} color="#C01918" />
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.excerptWrap}>
            <ThemedText style={styles.excerpt} numberOfLines={excerptExpanded ? undefined : 4}>
              {story.body}
            </ThemedText>
            {!excerptExpanded && (
              <ThemedText
                style={[styles.excerpt, styles.excerptMeasure]}
                onLayout={(e) => setExcerptOverflows(e.nativeEvent.layout.height > EXCERPT_COLLAPSED_HEIGHT + 2)}
              >
                {story.body}
              </ThemedText>
            )}
          </ThemedView>
          {excerptOverflows && (
            <Pressable onPress={() => setExcerptExpanded((prev) => !prev)} hitSlop={8}>
              <ThemedText style={styles.excerptToggle}>
                {excerptExpanded ? 'See less' : '…more'}
              </ThemedText>
            </Pressable>
          )}

          <ThemedView style={styles.actionsRow}>
            <Pressable style={styles.sideAction} onPress={handleFavoriteToggle}>
              <Ionicons
                name={isFavorited ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isFavorited ? '#C01918' : theme.text}
              />
              <ThemedText type="small" style={styles.sideActionText}>
                {isFavorited ? 'Saved' : 'Save'}
              </ThemedText>
            </Pressable>

            <Pressable style={styles.primaryButton} onPress={() => goToChapter()}>
              <Ionicons name="book-outline" size={18} color="#fff" />
              <ThemedView style={styles.primaryButtonTextGroup}>
                <ThemedText style={styles.primaryButtonText} numberOfLines={1}>
                  {ctaLabel}
                </ThemedText>
                {ctaSubtitle && (
                  <ThemedText style={styles.primaryButtonSubtext} numberOfLines={1}>
                    {ctaSubtitle}
                  </ThemedText>
                )}
              </ThemedView>
            </Pressable>

            <Pressable style={styles.sideAction} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={theme.text} />
              <ThemedText type="small" style={styles.sideActionText}>
                Share
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.infoCard}>
            <ThemedView style={styles.infoCell}>
              <Ionicons name="calendar-outline" size={16} color={theme.placeholder} />
              <ThemedText type="smallBold" style={styles.infoValue} numberOfLines={1}>
                {updatedLabel}
              </ThemedText>
              <ThemedText type="small" style={styles.infoLabel}>
                Updated
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.infoDivider} />
            <ThemedView style={styles.infoCell}>
              {progressLoading ? (
                <Skeleton style={styles.infoSkeleton} />
              ) : (
                <>
                  <Ionicons name={statusIcon} size={16} color={statusColor} />
                  <ThemedText type="smallBold" style={[styles.infoValue, { color: statusColor }]} numberOfLines={1}>
                    {statusLabel}
                  </ThemedText>
                </>
              )}
              <ThemedText type="small" style={styles.infoLabel}>
                Status
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.infoDivider} />
            <ThemedView style={styles.infoCell}>
              <Ionicons name="time-outline" size={16} color={theme.placeholder} />
              <ThemedText type="smallBold" style={styles.infoValue}>
                {readMinutes} min
              </ThemedText>
              <ThemedText type="small" style={styles.infoLabel}>
                Read Time
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.infoDivider} />
            <ThemedView style={styles.infoCell}>
              <Ionicons name="reader-outline" size={16} color={theme.placeholder} />
              <ThemedText type="smallBold" style={styles.infoValue}>
                {hasChapters ? chapters.length : 1}
              </ThemedText>
              <ThemedText type="small" style={styles.infoLabel}>
                {hasChapters ? 'Chapters' : 'Part'}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {story.daily_lesson && (
            <ThemedView style={styles.lessonCard}>
              <ThemedView style={styles.lessonHeaderRow}>
                <Ionicons name="bulb-outline" size={16} color="#C01918" />
                <ThemedText type="smallBold" style={styles.lessonHeading}>
                  Today&apos;s Lesson
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.lessonText}>{story.daily_lesson}</ThemedText>
            </ThemedView>
          )}

          {story.reflection_question && (
            <ThemedView style={styles.reflectionCard}>
              <ThemedView style={styles.lessonHeaderRow}>
                <Ionicons name="help-circle-outline" size={16} color="#C01918" />
                <ThemedText type="smallBold" style={styles.lessonHeading}>
                  Reflect
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.reflectionText}>{story.reflection_question}</ThemedText>
            </ThemedView>
          )}

          {!chaptersLoading && chapters.length > 0 && (
            <ThemedView style={styles.chaptersSection}>
              <ThemedText type="smallBold" style={styles.chaptersHeading}>
                {chapters.length} Chapter{chapters.length === 1 ? '' : 's'}
              </ThemedText>
              {chapters.map((chapter) => (
                <Pressable
                  key={chapter.id}
                  style={styles.chapterRow}
                  onPress={() => goToChapter(chapter.chapter_number)}
                >
                  <ThemedView style={styles.chapterNumberBadge}>
                    <ThemedText type="smallBold" style={styles.chapterNumberText}>
                      {chapter.chapter_number}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText type="smallBold" style={styles.chapterTitle} numberOfLines={1}>
                    {chapter.title || `Chapter ${chapter.chapter_number}`}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={16} color="#8a8a8e" />
                </Pressable>
              ))}
            </ThemedView>
          )}

          <CommentsSection storyId={id ?? ''} />

          <CategoryRow
            label={`More ${categoryLabels[story.category] ?? story.category} stories`}
            stories={similar}
          />
        </ScrollView>
      </SafeAreaView>

      <AddToFolderModal visible={addingToFolder} onClose={() => setAddingToFolder(false)} storyId={id ?? ''} />
      <ReportModal visible={reporting} onClose={() => setReporting(false)} targetType="story" targetId={id ?? ''} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  // A fixed header (sibling of the ScrollView, not inside it) so Back stays
  // reachable without scrolling all the way up.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
    backgroundColor: 'transparent',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, backgroundColor: 'transparent' },
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  skeletonBackLink: { width: 60, height: 24, borderRadius: 4, marginBottom: Spacing.two },
  skeletonHeaderRow: { flexDirection: 'row', gap: Spacing.three, backgroundColor: 'transparent' },
  skeletonCover: { width: 130, height: 180, borderRadius: 12 },
  skeletonHeaderInfo: { flex: 1, gap: Spacing.two, paddingTop: Spacing.one, backgroundColor: 'transparent' },
  skeletonTag: { width: 100, height: 20, borderRadius: 4, marginTop: Spacing.two },
  skeletonTitle: { width: '90%', height: 31, borderRadius: 6 },
  skeletonLine: { width: '100%', height: 24, borderRadius: 4 },
  skeletonLineShort: { width: '60%', height: 24, borderRadius: 4 },
  // Cover + title/brand block, side by side like a book's title page.
  headerRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  cover: { width: 130, height: 180, borderRadius: 12, backgroundColor: '#1c1c1e' },
  headerInfo: { flex: 1, gap: Spacing.two, paddingTop: 2, backgroundColor: 'transparent' },
  title: { fontSize: 22, lineHeight: 27 },
  // No individual human authors on admin-curated stories -- this is a small
  // "published by" trust row (app logo + name + a checkmark) rather than a
  // fabricated author identity.
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
  brandLogo: { width: 20, height: 20, borderRadius: 10 },
  brandName: { fontWeight: '600', opacity: 0.85 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: 'transparent' },
  tagPill: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.4)',
    borderRadius: 14,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
  },
  tagPillText: { fontSize: 12, fontWeight: '600' },
  matureTagPill: {
    borderWidth: 1,
    borderColor: 'rgba(192,25,24,0.5)',
    borderRadius: 14,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  excerptWrap: { position: 'relative' },
  excerpt: { fontSize: 15, lineHeight: EXCERPT_LINE_HEIGHT, opacity: 0.8 },
  excerptMeasure: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0, zIndex: -1 },
  excerptToggle: { color: '#C01918', fontWeight: '600', marginTop: 4 },
  actionsRow: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.three, marginTop: Spacing.one },
  sideAction: { alignItems: 'center', justifyContent: 'center', gap: 2, width: 56, backgroundColor: 'transparent' },
  sideActionText: { fontSize: 11, opacity: 0.8 },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#700a0a',
    borderRadius: 14,
    paddingHorizontal: Spacing.two,
  },
  primaryButtonTextGroup: { alignItems: 'center', backgroundColor: 'transparent' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  primaryButtonSubtext: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: Spacing.three,
    backgroundColor: CardAsh,
    marginTop: Spacing.one,
  },
  infoCell: { flex: 1, alignItems: 'center', gap: 3, backgroundColor: 'transparent' },
  infoDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(128,128,128,0.3)' },
  infoValue: { fontSize: 12 },
  infoLabel: { fontSize: 11, opacity: 0.6 },
  infoSkeleton: { width: 50, height: 15, borderRadius: 4 },
  lessonCard: {
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: 'rgba(192, 25, 24,0.08)',
    gap: Spacing.one,
  },
  lessonHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonHeading: { color: '#C01918' },
  lessonText: { fontSize: 15, lineHeight: 22, opacity: 0.9 },
  reflectionCard: {
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: CardAsh,
    gap: Spacing.one,
  },
  reflectionText: { fontSize: 15, lineHeight: 22, fontStyle: 'italic', opacity: 0.9 },
  chaptersSection: { gap: Spacing.two, marginTop: Spacing.two },
  chaptersHeading: { opacity: 0.85 },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two + 4,
    backgroundColor: CardAsh,
  },
  chapterNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(192, 25, 24,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumberText: { color: '#C01918' },
  chapterTitle: { flex: 1 },
});
