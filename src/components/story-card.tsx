import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Story } from '@/lib/database.types';

export function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
      <Pressable style={styles.card}>
        {story.image_url && (
          <Image source={{ uri: story.image_url }} style={styles.image} contentFit="cover" />
        )}
        <ThemedText type="small" numberOfLines={2} style={styles.title}>
          {story.title}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { width: 140, marginRight: 12 },
  image: { width: 140, height: 100, borderRadius: 10, marginBottom: 4 },
  title: { opacity: 0.9 },
});
