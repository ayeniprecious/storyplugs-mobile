import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Skeleton } from '@/components/skeleton';
import { StoryGrid } from '@/components/story-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import type { Story } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export default function CategoryStories() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { labels: categoryLabels } = useCategories();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'published')
        .eq('category', slug)
        .order('published_at', { ascending: false });

      if (!cancelled) {
        setStories((data as Story[]) ?? []);
        setLoading(false);
      }
    }
    if (slug) load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/search" />
          <ThemedText type="title" style={styles.title}>
            {categoryLabels[slug ?? ''] ?? slug}
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.skeletonGrid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ThemedView key={i} style={styles.skeletonGridCard}>
                <Skeleton style={styles.skeletonPoster} />
              </ThemedView>
            ))}
          </ThemedView>
        ) : stories.length === 0 ? (
          <ThemedText type="small" style={styles.emptyHint}>
            No stories in this category yet.
          </ThemedText>
        ) : (
          <StoryGrid stories={stories} />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  title: { fontSize: 24, lineHeight: 30 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, backgroundColor: 'transparent' },
  skeletonGridCard: { width: '48%', marginBottom: Spacing.two },
  skeletonPoster: { width: '100%', aspectRatio: 2 / 3, borderRadius: 8 },
  emptyHint: { opacity: 0.6 },
});
