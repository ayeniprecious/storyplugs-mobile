import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ShortStoryCard } from '@/components/short-story-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Story } from '@/lib/database.types';

// Home's dedicated Short Stories section -- an endless horizontal row (no
// cap, unlike RankedStoryList's top-5) of every is_short_story story, plus
// a View all link into the full list page. Always on and sourced directly
// from is_short_story rather than admin-curated section membership, unlike
// the rest of Home's CuratedSection-driven blocks.
export function ShortStoriesRow({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null;

  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.headingRow}>
        <ThemedText type="smallBold" style={styles.heading}>
          Short Stories
        </ThemedText>
        <Link href="/short-stories" asChild>
          <Pressable style={styles.viewAll} hitSlop={8}>
            <ThemedText type="small" style={styles.viewAllText}>
              View all
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color="#C01918" />
          </Pressable>
        </Link>
      </ThemedView>
      <FlatList
        data={stories}
        keyExtractor={(story) => story.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        initialNumToRender={3}
        windowSize={3}
        removeClippedSubviews
        renderItem={({ item }) => <ShortStoryCard story={item} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two, marginBottom: Spacing.two },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  heading: { opacity: 0.85 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'transparent' },
  viewAllText: { color: '#C01918', fontWeight: '600' },
  row: { gap: Spacing.two },
});
