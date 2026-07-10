import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Story } from '@/lib/database.types';

// Cards are as narrow as 112px (ContinueReadingRow) -- a long, unbounded title wrapped
// to 2 lines could grow tall enough (especially at larger font-scale settings) to sit
// right on top of the progress bar pinned to the card's bottom edge. Capping the title
// to one short line and reserving space below it keeps the bar clear regardless of title
// length or font scale.
const MAX_TITLE_LENGTH = 32;

function truncateTitle(title: string) {
  const trimmed = title.trim();
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`;
}

export function StoryCard({ story, progressPercent }: { story: Story; progressPercent?: number }) {
  const hasProgress = progressPercent !== undefined;
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
        <ThemedText numberOfLines={1} style={[styles.title, hasProgress && styles.titleWithProgress]}>
          {truncateTitle(story.title)}
        </ThemedText>
        {hasProgress && (
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
  titleWithProgress: { paddingBottom: 14 },
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
