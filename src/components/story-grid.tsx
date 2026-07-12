import { useMemo } from 'react';
import { Animated, FlatList, StyleSheet } from 'react-native';

import { StoryCard } from '@/components/story-card';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import type { Story } from '@/lib/database.types';

function chunkPairs(items: Story[]) {
  const rows: Story[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

// 2-column StoryCard grid with its own scroll-reveal fade-in -- shared between
// Search's filtered results and the per-category listing page so both stay
// visually consistent and only need fixing in one place.
export function StoryGrid({ stories }: { stories: Story[] }) {
  const { handleScroll, getRowOpacity, onViewableItemsChanged, viewabilityConfig } = useScrollReveal();
  const rows = useMemo(() => chunkPairs(stories), [stories]);

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row[0].id}
      contentContainerStyle={styles.list}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      renderItem={({ item: row }) => (
        <Animated.View style={{ opacity: getRowOpacity(row[0].id) }}>
          <ThemedView style={styles.row}>
            {row.map((story) => (
              <ThemedView key={story.id} style={styles.gridCard}>
                <StoryCard story={story} />
              </ThemedView>
            ))}
            {row.length === 1 && <ThemedView style={styles.gridCard} />}
          </ThemedView>
        </Animated.View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: Spacing.six },
  row: { flexDirection: 'row', gap: Spacing.two },
  gridCard: { flex: 1, marginBottom: Spacing.two },
});
