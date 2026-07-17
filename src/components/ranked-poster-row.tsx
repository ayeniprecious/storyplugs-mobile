import { FlatList, StyleSheet, View } from 'react-native';

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
    <FlatList
      data={stories}
      keyExtractor={(story) => story.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      initialNumToRender={4}
      windowSize={3}
      removeClippedSubviews
      renderItem={({ item, index }) => (
        <View style={styles.cardWrap}>
          <StoryCard story={item} rank={index + 1} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two },
  cardWrap: { width: HomeCardWidth },
});
