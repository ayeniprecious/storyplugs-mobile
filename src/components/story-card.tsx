import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Story } from '@/lib/database.types';

export function StoryCard({ story, progressPercent }: { story: Story; progressPercent?: number }) {
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
        {progressPercent !== undefined && (
          <ThemedView style={styles.progressTrack}>
            <ThemedView style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </ThemedView>
        )}
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
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: { height: 3, backgroundColor: '#C01918' },
});
