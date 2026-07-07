import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRow } from '@/components/category-row';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useFavorite } from '@/hooks/use-favorite';
import { useStoryChapters } from '@/hooks/use-story-chapters';
import type { Story } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

interface PreviewProgress {
  completed: boolean;
  progressPercent: number;
}

export default function StoryPreview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [similar, setSimilar] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [previewProgress, setPreviewProgress] = useState<PreviewProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  const { isFavorited, toggle: toggleFavorite } = useFavorite(id ?? '');
  const { labels: categoryLabels } = useCategories();
  const { chapters, loading: chaptersLoading } = useStoryChapters(id ?? '');
  const player = useAudioPlayer(story?.audio_url ? { uri: story.audio_url } : null);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
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
    try {
      const result = await Share.share({
        message: `"${story.title}" — a story from StoryPlugs.\n\n${story.body.slice(0, 140)}...`,
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

  function handleListenToggle() {
    if (!story?.audio_url) return;
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  function goToChapter(chapterNumber?: number) {
    if (!id) return;
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
          <Link href="/(app)" asChild>
            <Pressable style={styles.backLinkCombined}>
              <Ionicons name="chevron-back" size={16} color="#e50914" />
              <ThemedText type="link">Back to Home</ThemedText>
            </Pressable>
          </Link>
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Link href="/(app)" asChild>
            <Pressable style={styles.backLinkCombined}>
              <Ionicons name="chevron-back" size={16} color="#e50914" />
              <ThemedText type="link">Back</ThemedText>
            </Pressable>
          </Link>

          {story.image_url && (
            <Image source={{ uri: story.image_url }} style={styles.heroImage} contentFit="cover" />
          )}

          <ThemedText type="small" style={styles.categoryTag}>
            {categoryLabels[story.category] ?? story.category}
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            {story.title}
          </ThemedText>
          <ThemedText style={styles.excerpt} numberOfLines={4}>
            {story.body}
          </ThemedText>

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
            <Pressable style={[styles.actionButton, styles.actionButtonRow]} onPress={toggleFavorite}>
              <Ionicons name={isFavorited ? 'checkmark' : 'bookmark-outline'} size={16} color="#e50914" />
              <ThemedText style={styles.actionButtonText}>{isFavorited ? 'Saved' : 'Save'}</ThemedText>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.actionButtonRow]} onPress={handleShare}>
              <Ionicons name="share-outline" size={16} color="#e50914" />
              <ThemedText style={styles.actionButtonText}>Share</ThemedText>
            </Pressable>
            {story.audio_url && (
              <Pressable style={[styles.actionButton, styles.actionButtonRow]} onPress={handleListenToggle}>
                <Ionicons name={playerStatus.playing ? 'pause' : 'headset-outline'} size={16} color="#e50914" />
                <ThemedText style={styles.actionButtonText}>
                  {playerStatus.playing ? 'Pause' : 'Listen'}
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>

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
  scrollContent: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  skeletonBackLink: { width: 60, height: 16, borderRadius: 4, marginBottom: Spacing.two },
  skeletonTag: { width: 100, height: 12, borderRadius: 4, marginTop: Spacing.two },
  skeletonTitle: { width: '70%', height: 30, borderRadius: 6 },
  skeletonLine: { width: '100%', height: 16, borderRadius: 4 },
  skeletonLineShort: { width: '60%', height: 16, borderRadius: 4 },
  backLinkCombined: {
    marginBottom: Spacing.two,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  heroImage: { width: '100%', height: 220, borderRadius: 16, marginBottom: Spacing.two },
  categoryTag: { color: '#e50914', fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 28, lineHeight: 34 },
  excerpt: { fontSize: 16, lineHeight: 24, opacity: 0.8 },
  completedBadge: {
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    backgroundColor: 'rgba(50,180,90,0.15)',
  },
  completedBadgeRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  completedBadgeText: { color: '#32b45a', fontWeight: '700' },
  progressSection: { gap: 4 },
  progressTrack: { height: 5, backgroundColor: 'rgba(128,128,128,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: '#e50914' },
  progressLabel: { opacity: 0.6 },
  primaryButton: {
    backgroundColor: '#e50914',
    borderRadius: 10,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  actionsRow: { flexDirection: 'row', gap: Spacing.two },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e50914',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
  },
  actionButtonText: { color: '#e50914', fontWeight: '700' },
  actionButtonRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  chaptersSection: { gap: Spacing.two, marginTop: Spacing.two },
  chaptersHeading: { opacity: 0.85 },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c2c2e',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two + 4,
  },
  chapterNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(229,9,20,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumberText: { color: '#e50914' },
  chapterTitle: { flex: 1 },
});
