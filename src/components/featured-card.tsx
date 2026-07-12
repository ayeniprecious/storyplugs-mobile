import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCategories } from '@/context/categories-context';
import type { Story } from '@/lib/database.types';
import { estimateReadMinutes } from '@/lib/read-time';

// Landscape, not the 2:3 poster StoryCard uses everywhere else -- a promo-style
// carousel card needs room for a bigger title and reads better wide than tall.
export const FEATURED_CARD_WIDTH = 300;
const FEATURED_CARD_HEIGHT = 170;

export function FeaturedCard({ story }: { story: Story }) {
  const { labels: categoryLabels } = useCategories();

  return (
    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
      <Pressable style={styles.card}>
        {story.image_url && (
          <Image source={{ uri: story.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.85)']}
          locations={[0.3, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ThemedView style={styles.content}>
          <ThemedView style={styles.metaRow}>
            <ThemedText type="small" style={styles.categoryTag}>
              {(categoryLabels[story.category] ?? story.category).toUpperCase()}
            </ThemedText>
            <ThemedText type="small" style={styles.readTime}>
              · {estimateReadMinutes(story.body)} min read
            </ThemedText>
          </ThemedView>
          <ThemedText style={styles.title} numberOfLines={2}>
            {story.title}
          </ThemedText>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: FEATURED_CARD_WIDTH,
    height: FEATURED_CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    justifyContent: 'flex-end',
  },
  content: { padding: 12, gap: 3, backgroundColor: 'transparent' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  categoryTag: { color: '#C01918', fontWeight: '700', fontSize: 11 },
  readTime: { color: '#e5e5e5', opacity: 0.8, fontSize: 11 },
  title: { color: '#fff', fontSize: 17, lineHeight: 21, fontWeight: '700' },
});
