import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRow } from '@/components/category-row';
import { FeaturedCarousel } from '@/components/featured-carousel';
import { RankedStoryList } from '@/components/ranked-story-list';
import { Skeleton } from '@/components/skeleton';
import { isNewStory } from '@/components/story-card';
import { StoryGrid } from '@/components/story-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useAllStories } from '@/hooks/use-all-stories';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { useTheme } from '@/hooks/use-theme';

const BROWSE_CONTAINER_ID = 'browse';

export default function Search() {
  const { byCategory, loading } = useAllStories();
  const { order: categoryOrder, labels: categoryLabels } = useCategories();
  const { recent, addSearch, removeSearch, clearAll } = useRecentSearches();
  const [query, setQuery] = useState('');
  const theme = useTheme();
  const { registerContainer, registerRow, handleScroll } = useScrollReveal();

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

  // Falls back through is_featured -> is_pinned -> most recent, so the
  // carousel is never empty before an admin curates anything.
  const featuredStories = useMemo(() => {
    const featured = allStories.filter((s) => s.is_featured);
    if (featured.length > 0) return featured;
    const pinned = allStories.filter((s) => s.is_pinned);
    if (pinned.length > 0) return pinned;
    return [...allStories]
      .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
      .slice(0, 5);
  }, [allStories]);

  // Same 7-day window as the "New" ribbon badge on StoryCard, reused rather
  // than duplicated so the two stay consistent with each other. Capped --
  // rendered as a vertical numbered list now, not a horizontal carousel, so
  // an uncapped week's worth of stories would dominate the whole browse page.
  const newThisWeek = useMemo(() => allStories.filter(isNewStory).slice(0, 10), [allStories]);

  function runSearch(text: string) {
    setQuery(text);
    addSearch(text);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Search
        </ThemedText>
        <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.placeholder} style={styles.inputIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => addSearch(query)}
            returnKeyType="search"
            placeholder="Search by title or category"
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { color: theme.text }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={theme.placeholder} />
            </Pressable>
          )}
        </ThemedView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabScroll}
          contentContainerStyle={styles.categoryTabRow}
        >
          {categoryOrder.map((category) => (
            <View key={category}>
              <Link href={{ pathname: '/category/[slug]', params: { slug: category } }} asChild>
                <Pressable style={styles.categoryTab}>
                  <ThemedText type="small">{categoryLabels[category] ?? category}</ThemedText>
                </Pressable>
              </Link>
            </View>
          ))}
        </ScrollView>

        {loading ? (
          <ThemedView style={styles.skeletonGrid}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <ThemedView key={i} style={styles.skeletonGridCard}>
                <Skeleton style={styles.skeletonPoster} />
              </ThemedView>
            ))}
          </ThemedView>
        ) : isSearching ? (
          results.length === 0 ? (
            <ThemedText type="small" style={styles.hint}>
              No results for &ldquo;{query}&rdquo;.
            </ThemedText>
          ) : (
            <StoryGrid stories={results} />
          )
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <ThemedView {...registerContainer(BROWSE_CONTAINER_ID)}>
              <FeaturedCarousel stories={featuredStories} />

              <ThemedView style={styles.suggestions}>
                {recent.length > 0 && (
                  <Animated.View {...registerRow('recent-searches', BROWSE_CONTAINER_ID)}>
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
                  </Animated.View>
                )}

                <Animated.View {...registerRow('popular-searches', BROWSE_CONTAINER_ID)}>
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
                </Animated.View>
              </ThemedView>

              {newThisWeek.length > 0 && (
                <Animated.View {...registerRow('new-this-week', BROWSE_CONTAINER_ID)}>
                  <RankedStoryList label="New This Week" stories={newThisWeek} />
                </Animated.View>
              )}

              {categoryOrder.map((category) => (
                <Animated.View key={category} {...registerRow(`category-${category}`, BROWSE_CONTAINER_ID)}>
                  <CategoryRow
                    label={categoryLabels[category] ?? category}
                    stories={byCategory[category] ?? []}
                  />
                </Animated.View>
              ))}
            </ThemedView>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  title: { fontSize: 24, lineHeight: 30, marginBottom: Spacing.three },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
  },
  inputIcon: { backgroundColor: 'transparent' },
  input: {
    flex: 1,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  hint: { opacity: 0.6 },
  list: { paddingBottom: Spacing.six },
  // ScrollView applies flexGrow:1 to itself by default, which is fine when
  // nested inside an already-scrollable content flow (like CategoryRow's own
  // horizontal rows) but genuinely competes for space when placed as a direct
  // sibling of the screen's main scrollable content, as this row is -- opt out
  // so it takes only its natural content height instead of getting squeezed.
  categoryTabScroll: { flexGrow: 0, flexShrink: 0 },
  categoryTabRow: { gap: Spacing.two, paddingBottom: Spacing.three, alignItems: 'flex-start' },
  categoryTab: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, backgroundColor: 'transparent' },
  skeletonGridCard: { width: '48%', marginBottom: Spacing.two },
  skeletonPoster: { width: '100%', aspectRatio: 2 / 3, borderRadius: 8 },
  suggestions: { gap: Spacing.three, marginTop: Spacing.three, marginBottom: Spacing.two },
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
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  popularChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
});
