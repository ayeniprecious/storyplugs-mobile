import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Story } from '@/lib/database.types';

// Apple Books-style library card: a solid admin-picked color instead of a
// cover image, title pinned to the top and author pinned to the bottom (via
// justify-content, not absolute positioning -- there's no image to overlay
// on top of here). Falls back to a neutral color for stories that haven't
// had one set yet.
const FALLBACK_COLOR = '#2c2c2e';

export function BookCoverCard({ story }: { story: Story }) {
  const color = story.cover_color || FALLBACK_COLOR;

  return (
    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
      <Pressable style={StyleSheet.flatten([styles.card, { backgroundColor: color }])}>
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(0,0,0,0.12)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <Text numberOfLines={4} style={styles.title}>
            {story.title}
          </Text>
          {story.author_name && (
            <Text numberOfLines={1} style={styles.author}>
              {story.author_name}
            </Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  title: { color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 18 },
  author: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '400' },
});
