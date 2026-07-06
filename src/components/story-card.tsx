import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Story } from '@/lib/database.types';

export function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
      <Pressable style={styles.card}>
        {story.image_url && (
          <Image source={{ uri: story.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          locations={[0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ThemedText numberOfLines={2} style={styles.title}>
          {story.title}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    justifyContent: 'flex-end',
  },
  title: { color: '#fff', fontSize: 13, fontWeight: '600', padding: 8, lineHeight: 17 },
});
