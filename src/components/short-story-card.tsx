import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { getCoverColor } from '@/components/book-cover-card';
import { ThemedText } from '@/components/themed-text';
import type { Story } from '@/lib/database.types';
import { estimateReadMinutes } from '@/lib/read-time';

// A wide, low card (as opposed to the app's usual 2:3 poster) -- the shape
// itself reads as "quick read" at a glance, distinct from the taller browse
// carousels elsewhere on Home.
export function ShortStoryCard({ story }: { story: Story }) {
  const minutes = estimateReadMinutes(story.body);

  return (
    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
      <Pressable style={styles.card}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: getCoverColor(story) }]} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heartBadge}>
          <Ionicons name="heart" size={11} color="#fff" />
        </View>
        <View style={styles.content}>
          <ThemedText numberOfLines={2} style={styles.title}>
            {story.title}
          </ThemedText>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.75)" />
            <ThemedText style={styles.meta}>{minutes} min read</ThemedText>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 210,
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    justifyContent: 'flex-end',
  },
  heartBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(192,25,24,0.85)',
  },
  content: { padding: 10, gap: 4 },
  title: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500' },
});
