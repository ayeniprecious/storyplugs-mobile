import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { FolderCoverStack } from '@/components/folder-cover-stack';
import { ThemedText } from '@/components/themed-text';
import { CardAsh, Spacing } from '@/constants/theme';
import type { FolderSummary } from '@/hooks/use-story-folders';

const TILE_WIDTH = 132;
const STACK_HEIGHT = 96;

// Folder tile for Library's "My Folders" row -- the fanned cover-peek stack
// itself is shared with the Add to Folder picker's rows via
// FolderCoverStack, just rendered bigger here. A neutral counter badge sits
// in the stack's top-right corner.
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
          <FolderCoverStack coverStories={covers} size={68} />
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
    // A neutral translucent-black badge (matching a common "N of M" pill
    // convention) rather than a solid red fill -- red is reserved for the
    // empty-state folder icon and the tile's own accent moments.
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  name: { fontWeight: '600', paddingHorizontal: Spacing.one },
});
