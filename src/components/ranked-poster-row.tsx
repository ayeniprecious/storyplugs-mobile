import { ScrollView, StyleSheet, View } from 'react-native';

import { StoryCard } from '@/components/story-card';
import { HomeCardWidth, Spacing } from '@/constants/theme';
import type { Story } from '@/lib/database.types';

// The "list of stories" notification display: numbered poster cards in a
// horizontal scroll, rather than RankedStoryRow's vertical numbered list --
// same ranking concept, poster-card visual language instead. No label/heading
// of its own since it's meant to sit inside a notification card that already
// has a title.
export function RankedPosterRow({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {stories.map((story, i) => (
        <View key={story.id} style={styles.cardWrap}>
          <StoryCard story={story} rank={i + 1} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two },
  cardWrap: { width: HomeCardWidth },
});
