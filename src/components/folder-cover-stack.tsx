import { StyleSheet, View } from 'react-native';

import { getCoverColor } from '@/components/book-cover-card';
import type { Story } from '@/lib/database.types';

interface FolderCoverStackProps {
  coverStories: Story[];
  // The front (most recent) cover's edge length in px -- the back two
  // covers and their peek offsets all scale proportionally from this, so
  // the same component reads correctly at Library's tile size and the Add
  // to Folder picker's smaller row size.
  size: number;
}

// Shared "book spines peeking out of a folder" visual: the front (most
// recently added) cover sits flat and full-size with a drop shadow, the next
// two behind it are slightly smaller, rotated, and faded so their tips show
// past the front one's edges. Each cover is a solid admin-picked color
// swatch (matching BookCoverCard) rather than a cover image. Renders only
// the absolutely-positioned swatches -- the caller's own container needs
// alignItems/justifyContent 'center' to anchor them (matching how Library's
// FolderCard tile already centers its stack), and handles its own empty
// state when there are no covers yet.
export function FolderCoverStack({ coverStories, size }: FolderCoverStackProps) {
  const backSize = Math.round(size * 0.85);
  const thirdOffset = Math.round(size * 0.12);
  const secondOffset = Math.round(size * 0.06);

  return (
    <>
      {coverStories[2] && (
        <View
          style={[
            styles.cover,
            {
              width: backSize,
              height: backSize,
              borderRadius: Math.round(backSize * 0.14),
              top: thirdOffset,
              transform: [{ rotate: '-10deg' }],
              opacity: 0.5,
              backgroundColor: getCoverColor(coverStories[2]),
            },
          ]}
        />
      )}
      {coverStories[1] && (
        <View
          style={[
            styles.cover,
            {
              width: backSize,
              height: backSize,
              borderRadius: Math.round(backSize * 0.14),
              top: secondOffset,
              transform: [{ rotate: '8deg' }],
              opacity: 0.75,
              backgroundColor: getCoverColor(coverStories[1]),
            },
          ]}
        />
      )}
      {coverStories[0] && (
        <View
          style={[
            styles.cover,
            styles.coverFront,
            {
              width: size,
              height: size,
              borderRadius: Math.round(size * 0.13),
              backgroundColor: getCoverColor(coverStories[0]),
            },
          ]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cover: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  coverFront: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
