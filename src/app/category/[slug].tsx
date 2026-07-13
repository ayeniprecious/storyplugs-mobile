import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { RankedStoryRow } from '@/components/ranked-story-row';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useTheme } from '@/hooks/use-theme';
import type { Story } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export default function CategoryStories() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { labels: categoryLabels } = useCategories();
  const theme = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stories;
    return stories.filter((story) => story.title.toLowerCase().includes(q));
  }, [stories, query]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/search" />
          <ThemedText type="title" style={styles.title}>
            {categoryLabels[slug ?? ''] ?? slug}
          </ThemedText>
        </ThemedView>

        <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.placeholder} style={styles.inputIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            placeholder={`Search ${categoryLabels[slug ?? ''] ?? 'this category'}`}
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { color: theme.text }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={theme.placeholder} />
            </Pressable>
          )}
        </ThemedView>

        {loading ? (
          <View>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonRow}>
                <Skeleton style={styles.skeletonThumb} />
                <View style={styles.skeletonBody}>
                  <Skeleton style={styles.skeletonLine} />
                  <Skeleton style={styles.skeletonLineShort} />
                </View>
              </View>
            ))}
          </View>
        ) : stories.length === 0 ? (
          <ThemedText type="small" style={styles.emptyHint}>
            No stories in this category yet.
          </ThemedText>
        ) : results.length === 0 ? (
          <ThemedText type="small" style={styles.emptyHint}>
            No results for &ldquo;{query}&rdquo;.
          </ThemedText>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {results.map((story, i) => (
              <RankedStoryRow key={story.id} story={story} isLast={i === results.length - 1} />
            ))}
          </ScrollView>
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  inputIcon: { backgroundColor: 'transparent' },
  input: {
    flex: 1,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  emptyHint: { opacity: 0.6 },
  skeletonRow: { flexDirection: 'row', gap: Spacing.two, paddingVertical: Spacing.two + 4 },
  skeletonThumb: { width: 64, height: 92, borderRadius: 6 },
  skeletonBody: { flex: 1, gap: Spacing.two, paddingTop: Spacing.two },
  skeletonLine: { height: 15, borderRadius: 4, width: '80%' },
  skeletonLineShort: { height: 12, borderRadius: 4, width: '40%' },
});
