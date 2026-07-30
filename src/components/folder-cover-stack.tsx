import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import {
  CoverSpine,
  COVER_GRADIENT_COLORS,
  COVER_GRADIENT_LOCATIONS,
  getCoverColor,
} from '@/components/book-cover-card';
import type { Story } from '@/lib/database.types';

interface FolderCoverStackProps {
  coverStories: Story[];
  // The front (most recent) cover's edge length in px -- the back two
  // covers and their peek offsets all scale proportionally from this, so
  // the same component reads correctly at Library's tile size and the Add
  // to Folder picker's smaller row size.
  size: number;
}

// Below this the front cover is too small for its title to be legible (the
// Add to Folder picker's 36px row size), so it stays a plain color swatch.
const MIN_SIZE_FOR_TITLE = 50;

// Shared "book spines peeking out of a folder" visual: the front (most
// recently added) cover sits flat and full-size with a drop shadow and a
// spine highlight, the next two behind it are slightly smaller, rotated,
// and faded so their tips show past the front one's edges. Each cover is a
// solid admin-picked color swatch with the same dark gradient wash and
// low, book-style border radius as BookCoverCard -- the front one also
// prints the story's title when there's enough room to read it. Renders
// only the absolutely-positioned swatches -- the caller's own container
// needs alignItems/justifyContent 'center' to anchor them (matching how
// Library's FolderCard tile already centers its stack), and handles its
// own empty state when there are no covers yet.
export function FolderCoverStack({ coverStories, size }: FolderCoverStackProps) {
  const backSize = Math.round(size * 0.85);
  const thirdOffset = Math.round(size * 0.12);
  const secondOffset = Math.round(size * 0.06);
  const showFrontTitle = size >= MIN_SIZE_FOR_TITLE;

  return (
    <>
      {coverStories[2] && (
        <View
          style={[
            styles.cover,
            styles.coverAbsolute,
            {
              width: backSize,
              height: backSize,
              top: thirdOffset,
              transform: [{ rotate: '-10deg' }],
              opacity: 0.5,
              backgroundColor: getCoverColor(coverStories[2]),
            },
          ]}
        >
          <LinearGradient
            colors={COVER_GRADIENT_COLORS}
            locations={COVER_GRADIENT_LOCATIONS}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      {coverStories[1] && (
        <View
          style={[
            styles.cover,
            styles.coverAbsolute,
            {
              width: backSize,
              height: backSize,
              top: secondOffset,
              transform: [{ rotate: '8deg' }],
              opacity: 0.75,
              backgroundColor: getCoverColor(coverStories[1]),
            },
          ]}
        >
          <LinearGradient
            colors={COVER_GRADIENT_COLORS}
            locations={COVER_GRADIENT_LOCATIONS}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      {coverStories[0] && (
        // Shadow lives on this outer, non-clipping wrapper -- overflow:
        // hidden on `cover` (needed to clip the gradient/spine to the
        // rounded corners) would otherwise clip the shadow to nothing.
        <View style={[styles.coverFrontShadowWrap, { width: size, height: size }]}>
          <View style={[styles.cover, styles.coverFrontInner, { backgroundColor: getCoverColor(coverStories[0]) }]}>
            <LinearGradient
              colors={COVER_GRADIENT_COLORS}
              locations={COVER_GRADIENT_LOCATIONS}
              style={StyleSheet.absoluteFill}
            />
            <CoverSpine widthPercent={22} />
            {showFrontTitle && (
              <View style={styles.frontContent}>
                <Text numberOfLines={3} style={styles.frontTitle}>
                  {coverStories[0].title}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  coverAbsolute: { position: 'absolute' },
  coverFrontShadowWrap: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  coverFrontInner: { flex: 1 },
  frontContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  frontTitle: {
    color: '#fff',
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
    fontFamily: 'Montserrat_600SemiBold',
  },
});
