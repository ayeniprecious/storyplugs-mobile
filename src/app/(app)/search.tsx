import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { StoryCard } from '@/components/story-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useAllStories } from '@/hooks/use-all-stories';
import { useRecentSearches } from '@/hooks/use-recent-searches';

export default function Search() {
  const { byCategory, loading } = useAllStories();
  const { order: categoryOrder, labels: categoryLabels } = useCategories();
  const { recent, addSearch, removeSearch, clearAll } = useRecentSearches();
  const [query, setQuery] = useState('');

  const allStories = useMemo(() => Object.values(byCategory).flat(), [byCategory]);
  const isSearching = query.trim() !== '';

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allStories;
    return allStories.filter(
      (story) =>
        story.title.toLowerCase().includes(q) ||
        (categoryLabels[story.category] ?? story.category).toLowerCase().includes(q)
    );
  }, [allStories, query]);

  function runSearch(text: string) {
    setQuery(text);
    addSearch(text);
  }

  const suggestions = (
    <ThemedView style={styles.suggestions}>
      {recent.length > 0 && (
        <ThemedView style={styles.suggestionSection}>
          <ThemedView style={styles.suggestionHeaderRow}>
            <ThemedText type="smallBold" style={styles.suggestionHeading}>
              Recent Searches
            </ThemedText>
            <Pressable onPress={clearAll}>
              <ThemedText type="small" style={styles.clearAll}>
                Clear all
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={styles.chipRow}>
            {recent.map((term) => (
              <ThemedView key={term} style={styles.chip}>
                <Pressable onPress={() => setQuery(term)}>
                  <ThemedText type="small">{term}</ThemedText>
                </Pressable>
                <Pressable onPress={() => removeSearch(term)} hitSlop={8}>
                  <Ionicons name="close" size={14} color="#8a8a8e" />
                </Pressable>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>
      )}

      <ThemedView style={styles.suggestionSection}>
        <ThemedText type="smallBold" style={styles.suggestionHeading}>
          Popular Searches
        </ThemedText>
        <ThemedView style={styles.chipRow}>
          {categoryOrder.map((category) => (
            <Pressable
              key={category}
              style={styles.popularChip}
              onPress={() => runSearch(categoryLabels[category] ?? category)}
            >
              <ThemedText type="small">{categoryLabels[category] ?? category}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>

      <ThemedText type="smallBold" style={styles.suggestionHeading}>
        All Stories
      </ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Search
        </ThemedText>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => addSearch(query)}
          returnKeyType="search"
          placeholder="Search by title or category"
          placeholderTextColor="#8a8a8a"
          style={styles.input}
          autoFocus
        />

        {loading ? (
          <ThemedView style={styles.skeletonGrid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ThemedView key={i} style={styles.skeletonGridCard}>
                <Skeleton style={styles.skeletonPoster} />
              </ThemedView>
            ))}
          </ThemedView>
        ) : results.length === 0 ? (
          <>
            {!isSearching && suggestions}
            <ThemedText type="small" style={styles.hint}>
              No results for &ldquo;{query}&rdquo;.
            </ThemedText>
          </>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            ListHeaderComponent={isSearching ? null : suggestions}
            renderItem={({ item }) => (
              <ThemedView style={styles.gridCard}>
                <StoryCard story={item} />
              </ThemedView>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  title: { fontSize: 24, lineHeight: 30, marginBottom: Spacing.three },
  input: {
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
    color: '#fff',
    marginBottom: Spacing.three,
  },
  hint: { opacity: 0.6 },
  list: { paddingBottom: Spacing.six },
  row: { gap: Spacing.two },
  gridCard: { flex: 1, marginBottom: Spacing.two },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, backgroundColor: 'transparent' },
  skeletonGridCard: { width: '48%', marginBottom: Spacing.two },
  skeletonPoster: { width: '100%', aspectRatio: 2 / 3, borderRadius: 8 },
  suggestions: { gap: Spacing.three, marginBottom: Spacing.three },
  suggestionSection: { gap: Spacing.two },
  suggestionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  suggestionHeading: { opacity: 0.85 },
  clearAll: { color: '#C01918' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  popularChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: 'rgba(192, 25, 24,0.15)',
  },
});
