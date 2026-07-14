import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import type { Story } from '@/lib/database.types';

interface FolderCoverStackProps {
  coverStories: Story[];
  // The front (most recent) cover's edge length in px -- the back two
  // covers and their peek offsets all scale proportionally from this, so
  // the same component reads correctly at Library's tile size and the Add
  // to Folder picker's smaller row size.
  size: number;
}

// Shared "photos peeking out of a folder" visual: the front (most recently
// added) cover sits flat and full-size with a drop shadow, the next two
// behind it are slightly smaller, rotated, and faded so their tips show
// past the front one's edges. Renders only the absolutely-positioned cover
// images -- the caller's own container needs alignItems/justifyContent
// 'center' to anchor them (matching how Library's FolderCard tile already
// centers its stack), and handles its own empty state when there are no
// covers yet.
export function FolderCoverStack({ coverStories, size }: FolderCoverStackProps) {
  const backSize = Math.round(size * 0.85);
  const thirdOffset = Math.round(size * 0.12);
  const secondOffset = Math.round(size * 0.06);

  return (
    <>
      {coverStories[2]?.image_url && (
        <Image
          source={{ uri: coverStories[2].image_url }}
          style={[
            styles.cover,
            {
              width: backSize,
              height: backSize,
              borderRadius: Math.round(backSize * 0.14),
              top: thirdOffset,
              transform: [{ rotate: '-10deg' }],
              opacity: 0.5,
            },
          ]}
          contentFit="cover"
        />
      )}
      {coverStories[1]?.image_url && (
        <Image
          source={{ uri: coverStories[1].image_url }}
          style={[
            styles.cover,
            {
              width: backSize,
              height: backSize,
              borderRadius: Math.round(backSize * 0.14),
              top: secondOffset,
              transform: [{ rotate: '8deg' }],
              opacity: 0.75,
            },
          ]}
          contentFit="cover"
        />
      )}
      {coverStories[0]?.image_url && (
        <Image
          source={{ uri: coverStories[0].image_url }}
          style={[
            styles.cover,
            styles.coverFront,
            { width: size, height: size, borderRadius: Math.round(size * 0.13) },
          ]}
          contentFit="cover"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cover: { position: 'absolute' },
  coverFront: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
