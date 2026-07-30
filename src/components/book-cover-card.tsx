import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Story } from '@/lib/database.types';

// Apple Books-style library card: a solid admin-picked color instead of a
// cover image, title and author both centered on their own lines (via
// justify-content/text-align, not absolute positioning -- there's no image
// to overlay on top of here). Falls back to a neutral color for stories
// that haven't had one set yet. Accepts the same optional progressPercent/
// rank props StoryCard did, so it's a drop-in replacement everywhere a
// poster-style story card is used.
const FALLBACK_COLOR = '#2c2c2e';

export function getCoverColor(story: Story) {
  return story.cover_color || FALLBACK_COLOR;
}

export function BookCoverCard({
  story,
  progressPercent,
  rank,
}: {
  story: Story;
  progressPercent?: number;
  rank?: number;
}) {
  const color = story.cover_color || FALLBACK_COLOR;
  const hasProgress = progressPercent !== undefined;

  return (
    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
      <Pressable style={StyleSheet.flatten([styles.card, { backgroundColor: color }])}>
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(0,0,0,0.12)']}
          style={StyleSheet.absoluteFill}
        />
        {rank !== undefined && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>{rank}</Text>
          </View>
        )}
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
        {hasProgress && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 6,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'Montserrat_600SemiBold',
  },
  author: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Montserrat_400Regular',
  },
  rankBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  rankBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
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
