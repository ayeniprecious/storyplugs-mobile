import { ScrollView, StyleSheet, View } from 'react-native';

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
      <ThemedText type="smallBold" style={styles.heading}>
        Continue Reading
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map(({ story, progressPercent }) => (
          <View key={story.id} style={styles.cardWrap}>
            <StoryCard story={story} progressPercent={progressPercent} />
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two, marginBottom: Spacing.two },
  heading: { opacity: 0.85 },
  row: { gap: Spacing.two },
  cardWrap: { width: HomeCardWidth },
});
