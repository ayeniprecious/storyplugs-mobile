import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { StoryCard } from '@/components/story-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HomeCardWidth, Spacing } from '@/constants/theme';
import type { Story } from '@/lib/database.types';

interface ContinueReadingItem {
  story: Story;
  progressPercent: number;
}

export function ContinueReadingRow({ items }: { items: ContinueReadingItem[] }) {
  if (items.length === 0) return null;

  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.headingRow}>
        <ThemedText type="smallBold" style={styles.heading}>
          Continue Reading
        </ThemedText>
        <Link href="/library/continue-reading" asChild>
          <Pressable style={styles.viewAll} hitSlop={8}>
            <ThemedText type="small" style={styles.viewAllText}>
              View all
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color="#C01918" />
          </Pressable>
        </Link>
      </ThemedView>
      <FlatList
        data={items}
        keyExtractor={(item) => item.story.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        initialNumToRender={4}
        windowSize={3}
        removeClippedSubviews
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <StoryCard story={item.story} progressPercent={item.progressPercent} />
          </View>
        )}
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
  cardWrap: { width: HomeCardWidth },
});
