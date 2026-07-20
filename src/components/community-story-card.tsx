import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import type { StorySubmission } from '@/lib/database.types';

export function CommunityStoryCard({ story }: { story: StorySubmission }) {
  const { labels: categoryLabels } = useCategories();

  return (
    <Link href={{ pathname: '/community-story/[id]', params: { id: story.id } }} asChild>
      <Pressable style={styles.card}>
        {story.category && (
          <ThemedText type="small" style={styles.category}>
            {(categoryLabels[story.category] ?? story.category).toUpperCase()}
          </ThemedText>
        )}
        <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>
          {story.title}
        </ThemedText>
        <ThemedText type="small" style={styles.excerpt} numberOfLines={2}>
          {story.body}
        </ThemedText>
        <ThemedText type="small" style={styles.author}>
          By {story.author_name}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: 4,
    backgroundColor: CardAsh,
  },
  category: { color: '#C01918', fontWeight: '700', fontSize: 11, letterSpacing: 0.3 },
  title: { fontSize: 16 },
  excerpt: { opacity: 0.7, lineHeight: 19 },
  author: { opacity: 0.5, marginTop: 2 },
});
