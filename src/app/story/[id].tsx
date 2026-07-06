import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRow } from '@/components/category-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { CATEGORY_LABELS } from '@/hooks/use-all-stories';
import { useFavorite } from '@/hooks/use-favorite';
import { useStoryProgress } from '@/hooks/use-story-progress';
import type { Story } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export default function StoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [similar, setSimilar] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { isFavorited, toggle: toggleFavorite } = useFavorite(id ?? '');
  const { progress, markComplete, markListened, updateProgressPercent } = useStoryProgress(id ?? '');
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

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    if (scrollable <= 0) return;
    const percent = Math.min(100, Math.round((contentOffset.y / scrollable) * 100));
    updateProgressPercent(percent);
  }

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

  async function handleListenToggle() {
    if (!story?.audio_url) return;
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.play();
      await markListened();
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.centerFill}>
          <ActivityIndicator />
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

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.progressTrack}>
        <ThemedView style={[styles.progressFill, { width: `${progress?.progressPercent ?? 0}%` }]} />
      </ThemedView>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={200}
        >
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
            {CATEGORY_LABELS[story.category] ?? story.category}
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            {story.title}
          </ThemedText>
          <ThemedText style={styles.body}>{story.body}</ThemedText>

          {story.reflection_question && (
            <ThemedView type="backgroundElement" style={styles.calloutBox}>
              <ThemedText type="smallBold">Reflect</ThemedText>
              <ThemedText type="small">{story.reflection_question}</ThemedText>
            </ThemedView>
          )}
          {story.daily_lesson && (
            <ThemedView type="backgroundElement" style={styles.calloutBox}>
              <ThemedText type="smallBold">Today&apos;s Lesson</ThemedText>
              <ThemedText type="small">{story.daily_lesson}</ThemedText>
            </ThemedView>
          )}

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
                <Ionicons name={playerStatus.playing ? 'pause' : 'play'} size={16} color="#e50914" />
                <ThemedText style={styles.actionButtonText}>
                  {playerStatus.playing ? 'Pause' : 'Listen'}
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>

          {progress?.completed ? (
            <ThemedView style={[styles.completedBadge, styles.actionButtonRow]}>
              <Ionicons name="checkmark-circle" size={18} color="#32b45a" />
              <ThemedText style={styles.completedBadgeText}>Marked as Complete</ThemedText>
            </ThemedView>
          ) : (
            <Pressable style={styles.completeButton} onPress={markComplete}>
              <ThemedText style={styles.completeButtonText}>Mark as Complete</ThemedText>
            </Pressable>
          )}

          <CategoryRow
            label={`More ${CATEGORY_LABELS[story.category] ?? story.category} stories`}
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
  progressTrack: { height: 3, backgroundColor: 'rgba(128,128,128,0.25)' },
  progressFill: { height: 3, backgroundColor: '#e50914' },
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
  body: { fontSize: 16, lineHeight: 24, opacity: 0.9 },
  calloutBox: { padding: Spacing.three, borderRadius: 12, gap: 4 },
  actionsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
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
  completeButton: {
    marginTop: Spacing.two,
    backgroundColor: '#e50914',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
  },
  completeButtonText: { color: '#fff', fontWeight: '700' },
  completedBadge: {
    marginTop: Spacing.two,
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    backgroundColor: 'rgba(50,180,90,0.15)',
  },
  completedBadgeText: { color: '#32b45a', fontWeight: '700' },
});
