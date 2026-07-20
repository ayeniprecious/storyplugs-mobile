import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import type { StorySubmission } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export default function CommunityStoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { labels: categoryLabels } = useCategories();
  const [story, setStory] = useState<StorySubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('story_submissions')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .eq('is_visible', true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setStory(data as StorySubmission);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/community-stories" />
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.scrollContent}>
            <Skeleton style={styles.skeletonTitle} />
            <Skeleton style={styles.skeletonLine} />
            <Skeleton style={styles.skeletonLine} />
          </ThemedView>
        ) : notFound || !story ? (
          <ThemedView style={styles.centerFill}>
            <ThemedText type="smallBold">Story not found</ThemedText>
          </ThemedView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {story.category && (
              <ThemedText type="small" style={styles.category}>
                {(categoryLabels[story.category] ?? story.category).toUpperCase()}
              </ThemedText>
            )}
            <ThemedText type="title" style={styles.title}>
              {story.title}
            </ThemedText>
            <ThemedText type="small" style={styles.author}>
              By {story.author_name}
            </ThemedText>
            <ThemedText style={styles.body}>{story.body}</ThemedText>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { marginBottom: Spacing.two },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: Spacing.six, gap: Spacing.two },
  category: { color: '#C01918', fontWeight: '700', fontSize: 11, letterSpacing: 0.3 },
  title: { fontSize: 24, lineHeight: 30 },
  author: { opacity: 0.6, marginTop: -4 },
  body: { fontSize: 16, lineHeight: 25, opacity: 0.9, marginTop: Spacing.two },
  skeletonTitle: { width: '85%', height: 28, borderRadius: 6 },
  skeletonLine: { width: '100%', height: 18, borderRadius: 4 },
});
