import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Story } from '@/lib/database.types';

// Apple Books-style library card: a solid admin-picked color instead of a
// cover image, shaded and detailed to read as an actual physical book
// rather than a flat color chip -- a top-lit/bottom-shadowed wash, a
// rounded-spine highlight down the left edge, an embossed inner frame, and
// a drop shadow lifting it off the page. Title stays pinned at the top of
// the card and author at the bottom -- only their own text is centered
// (textAlign), not the block as a whole -- via justify-content:
// space-between, not absolute positioning. Falls back to a neutral color
// for stories that haven't had one set yet. Accepts the same optional
// progressPercent/rank props StoryCard did, so it's a drop-in replacement
// everywhere a poster-style story card is used.
const FALLBACK_COLOR = '#2c2c2e';

// Vertical "light falling on the cover" wash -- a soft highlight near the
// top sinking into shadow at the bottom -- shared by every book-shaped
// surface in the app so they all read as lit from the same direction.
export const COVER_GRADIENT_COLORS = ['rgba(255,255,255,0.12)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.62)'] as const;
export const COVER_GRADIENT_LOCATIONS = [0, 0.4, 1] as const;

const SPINE_COLORS = ['rgba(0,0,0,0.4)', 'rgba(255,255,255,0.32)', 'rgba(255,255,255,0)'] as const;

export function getCoverColor(story: Story) {
  return story.cover_color || FALLBACK_COLOR;
}

// The rounded spine every real hardcover has -- a dark hairline right at
// the binding edge, brightening into a highlight where the light catches
// the curve, then fading back into the rest of the cover. Absolutely
// positioned along the left edge; the caller just needs a relatively
// positioned, overflow-hidden parent.
export function CoverSpine({ widthPercent = 20 }: { widthPercent?: number }) {
  return (
    <LinearGradient
      colors={SPINE_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${widthPercent}%` }}
    />
  );
}

// The embossed inner frame classic/formal book covers print near their
// edges. Only worth it on covers big enough to read as a frame instead of
// clutter -- the main grid card and the story preview page's cover.
export function CoverFrame({ inset = 8 }: { inset?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: inset,
        left: inset,
        right: inset,
        bottom: inset,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
      }}
    />
  );
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
  const color = getCoverColor(story);
  const hasProgress = progressPercent !== undefined;

  return (
    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
      <Pressable style={styles.shadowWrap}>
        <View style={[styles.card, { backgroundColor: color }]}>
          <LinearGradient
            colors={COVER_GRADIENT_COLORS}
            locations={COVER_GRADIENT_LOCATIONS}
            style={StyleSheet.absoluteFill}
          />
          <CoverSpine />
          <CoverFrame />
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
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  // Shadow lives on this outer, non-clipping wrapper -- overflow: hidden
  // (needed on `card` below to clip the gradient/spine to the rounded
  // corners) would otherwise clip the shadow itself to nothing.
  shadowWrap: {
    width: '100%',
    aspectRatio: 2 / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  title: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    fontFamily: 'Montserrat_600SemiBold',
  },
  author: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
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
