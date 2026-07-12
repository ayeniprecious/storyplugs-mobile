import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { CategoryRow } from '@/components/category-row';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useAppSettings } from '@/hooks/use-app-settings';
import { isDownloaded, readDownloadedContent } from '@/hooks/use-downloads';
import { useFavorite } from '@/hooks/use-favorite';
import { useStoryChapters } from '@/hooks/use-story-chapters';
import { useTheme } from '@/hooks/use-theme';
import type { Story, StoryChapter } from '@/lib/database.types';
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

      const { data, error } = await supabase
        .from('stories')
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

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.scrollContent}>
            <Skeleton style={styles.skeletonBackLink} />
            <Skeleton style={styles.heroImage} />
            <Skeleton style={styles.skeletonTag} />
            <Skeleton style={styles.skeletonTitle} />
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

  let ctaLabel = 'Read Story';
  if (completed) ctaLabel = 'Read Again';
  else if (started) ctaLabel = 'Continue Reading';

  // 160 wpm reads as a comfortable, attentive pace for these stories -- fast enough that a
  // short story isn't overestimated, slow enough that a longer one doesn't feel rushed.
  const wordCount = story.body.trim().split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 160));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
          <BackButton href="/(app)" />

          {story.image_url && (
            <Image source={{ uri: story.image_url }} style={styles.heroImage} contentFit="cover" />
          )}

          <ThemedView style={styles.metaRow}>
            <ThemedText type="small" style={styles.categoryTag}>
              {categoryLabels[story.category] ?? story.category}
            </ThemedText>
            <ThemedText type="small" style={styles.readTime}>
              · {readMinutes} min read
            </ThemedText>
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            {story.title}
          </ThemedText>
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
                {excerptExpanded ? 'See less' : 'See more'}
              </ThemedText>
            </Pressable>
          )}

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
            <ThemedView style={[styles.reflectionCard, { borderColor: theme.border }]}>
              <ThemedView style={styles.lessonHeaderRow}>
                <Ionicons name="help-circle-outline" size={16} color="#C01918" />
                <ThemedText type="smallBold" style={styles.lessonHeading}>
                  Reflect
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.reflectionText}>{story.reflection_question}</ThemedText>
            </ThemedView>
          )}

          {!progressLoading && completed && (
            <ThemedView style={[styles.completedBadge, styles.completedBadgeRow]}>
              <Ionicons name="checkmark-circle" size={16} color="#32b45a" />
              <ThemedText style={styles.completedBadgeText}>Completed</ThemedText>
            </ThemedView>
          )}
          {!progressLoading && started && (
            <ThemedView style={styles.progressSection}>
              <ThemedView style={styles.progressTrack}>
                <ThemedView style={[styles.progressFill, { width: `${percent}%` }]} />
              </ThemedView>
              <ThemedText type="small" style={styles.progressLabel}>
                {percent}% read
              </ThemedText>
            </ThemedView>
          )}

          <Pressable style={[styles.primaryButton, styles.actionButtonRow]} onPress={() => goToChapter()}>
            <Ionicons name="play" size={16} color="#fff" />
            <ThemedText style={styles.primaryButtonText}>{ctaLabel}</ThemedText>
          </Pressable>

          <ThemedView style={styles.actionsRow}>
            <Pressable style={[styles.actionButton, styles.actionButtonRow]} onPress={handleFavoriteToggle}>
              <Ionicons name={isFavorited ? 'checkmark' : 'bookmark-outline'} size={16} color="#C01918" />
              <ThemedText style={styles.actionButtonText}>{isFavorited ? 'Saved' : 'Save'}</ThemedText>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.actionButtonRow]} onPress={handleShare}>
              <Ionicons name="share-outline" size={16} color="#C01918" />
              <ThemedText style={styles.actionButtonText}>Share</ThemedText>
            </Pressable>
          </ThemedView>

          {!chaptersLoading && chapters.length > 0 && (
            <ThemedView style={styles.chaptersSection}>
              <ThemedText type="smallBold" style={styles.chaptersHeading}>
                {chapters.length} Chapter{chapters.length === 1 ? '' : 's'}
              </ThemedText>
              {chapters.map((chapter) => (
                <Pressable
                  key={chapter.id}
                  style={[styles.chapterRow, { borderColor: theme.border }]}
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

          <CategoryRow
            label={`More ${categoryLabels[story.category] ?? story.category} stories`}
            stories={similar}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  skeletonBackLink: { width: 60, height: 24, borderRadius: 4, marginBottom: Spacing.two },
  skeletonTag: { width: 100, height: 20, borderRadius: 4, marginTop: Spacing.two },
  skeletonTitle: { width: '70%', height: 31, borderRadius: 6 },
  skeletonLine: { width: '100%', height: 24, borderRadius: 4 },
  skeletonLineShort: { width: '60%', height: 24, borderRadius: 4 },
  heroImage: { width: '100%', height: 220, borderRadius: 16, marginBottom: Spacing.two },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryTag: { color: '#C01918', fontWeight: '600', textTransform: 'uppercase' },
  readTime: { opacity: 0.6 },
  title: { fontSize: 25, lineHeight: 31 },
  excerptWrap: { position: 'relative' },
  excerpt: { fontSize: 16, lineHeight: EXCERPT_LINE_HEIGHT, opacity: 0.8 },
  excerptMeasure: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0, zIndex: -1 },
  excerptToggle: { color: '#C01918', fontWeight: '600', marginTop: 4 },
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
    borderWidth: 1,
    gap: Spacing.one,
  },
  reflectionText: { fontSize: 15, lineHeight: 22, fontStyle: 'italic', opacity: 0.9 },
  completedBadge: {
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    backgroundColor: 'rgba(50,180,90,0.15)',
  },
  completedBadgeRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  completedBadgeText: { color: '#32b45a', fontWeight: '600' },
  progressSection: { gap: 4 },
  progressTrack: { height: 5, backgroundColor: 'rgba(128,128,128,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: '#C01918' },
  progressLabel: { opacity: 0.6 },
  primaryButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  actionsRow: { flexDirection: 'row', gap: Spacing.two },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
  },
  actionButtonText: { color: '#C01918', fontWeight: '600' },
  actionButtonRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  chaptersSection: { gap: Spacing.two, marginTop: Spacing.two },
  chaptersHeading: { opacity: 0.85 },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two + 4,
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
