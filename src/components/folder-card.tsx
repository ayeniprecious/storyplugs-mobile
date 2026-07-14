import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardAsh, Spacing } from '@/constants/theme';
import type { FolderSummary } from '@/hooks/use-story-folders';

const TILE_WIDTH = 132;
const STACK_HEIGHT = 96;

// Folder tile for Library's "My Folders" row: up to 3 of the most recently
// added covers peek out from behind the front one, fanned at slight angles
// like photos tucked into a pocket -- the front (most recent) cover sits
// flat and full-size with a drop shadow for depth, the two behind it are
// smaller, more rotated, and more faded so their "tips" read as layered
// stack rather than a messy overlap. A red counter badge (matching the rest
// of the app's corner-badge language on StoryCard/RankedStoryRow) sits in
// the stack's top-right corner.
export function FolderCard({ folder, onPress }: { folder: FolderSummary; onPress: () => void }) {
  const covers = folder.coverStories;

  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <View style={styles.stack}>
        {covers.length === 0 ? (
          <View style={styles.emptyIconBadge}>
            <Ionicons name="folder-open" size={26} color="#C01918" />
          </View>
        ) : (
          <>
            {covers[2]?.image_url && (
              <Image source={{ uri: covers[2].image_url }} style={[styles.cover, styles.coverThird]} contentFit="cover" />
            )}
            {covers[1]?.image_url && (
              <Image source={{ uri: covers[1].image_url }} style={[styles.cover, styles.coverSecond]} contentFit="cover" />
            )}
            {covers[0]?.image_url && (
              <Image source={{ uri: covers[0].image_url }} style={[styles.cover, styles.coverFront]} contentFit="cover" />
            )}
          </>
        )}
        <View style={styles.countBadge}>
          <ThemedText style={styles.countBadgeText}>{folder.itemCount}</ThemedText>
        </View>
      </View>
      <ThemedText type="small" numberOfLines={1} style={styles.name}>
        {folder.name}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { width: TILE_WIDTH },
  stack: {
    width: TILE_WIDTH,
    height: STACK_HEIGHT,
    borderRadius: 12,
    backgroundColor: CardAsh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(192,25,24,0.15)',
  },
  cover: { position: 'absolute', width: 58, height: 58, borderRadius: 8 },
  coverThird: { top: 8, transform: [{ rotate: '-10deg' }], opacity: 0.5 },
  coverSecond: { top: 4, transform: [{ rotate: '8deg' }], opacity: 0.75 },
  coverFront: {
    width: 68,
    height: 68,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C01918',
  },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  name: { fontWeight: '600', paddingHorizontal: Spacing.one },
});
