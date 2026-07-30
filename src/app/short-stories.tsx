import { StyleSheet, View } from 'react-native';

import { ShortStoryCard } from '@/components/short-story-card';
import { StoryListScreen } from '@/components/story-list-screen';
import { useShortStories } from '@/hooks/use-short-stories';

// Reached via the "View all" button on Home's Short Stories row. Reuses the
// exact same card as that row (image cover, excerpt, Read/Save), just full
// width and stacked vertically instead of a fixed-width horizontal scroll.
export default function ShortStoriesScreen() {
  const { stories, loading } = useShortStories();

  return (
    <StoryListScreen
      title="Short Stories"
      backHref="/"
      loading={loading}
      isEmpty={stories.length === 0}
      emptyHint="No short stories yet -- check back soon."
    >
      <View style={styles.list}>
        {stories.map((story) => (
          <ShortStoryCard key={story.id} story={story} style={styles.card} />
        ))}
      </View>
    </StoryListScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  card: { width: '100%', height: 340 },
});
