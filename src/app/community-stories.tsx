import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { CommunityStoryCard } from '@/components/community-story-card';
import { StoryListScreen } from '@/components/story-list-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCommunityStories } from '@/hooks/use-story-submissions';

export default function CommunityStories() {
  const { stories, loading } = useCommunityStories();

  return (
    <StoryListScreen
      title="Community Stories"
      backHref="/library"
      loading={loading}
      isEmpty={stories.length === 0}
      emptyHint="No community stories yet — be the first to share yours."
    >
      <Link href="/submit-story" asChild>
        <Pressable style={styles.submitRow}>
          <Ionicons name="create-outline" size={18} color="#C01918" />
          <ThemedText type="smallBold" style={styles.submitText}>
            Submit your own story
          </ThemedText>
        </Pressable>
      </Link>
      {stories.map((story) => (
        <CommunityStoryCard key={story.id} story={story} />
      ))}
    </StoryListScreen>
  );
}

const styles = StyleSheet.create({
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#C01918',
    borderRadius: 12,
    padding: Spacing.three,
  },
  submitText: { color: '#C01918' },
});
