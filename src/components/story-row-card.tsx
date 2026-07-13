import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useTheme } from '@/hooks/use-theme';
import type { Story } from '@/lib/database.types';
import { estimateReadMinutes } from '@/lib/read-time';

interface StoryRowCardProps {
  story: Story;
  subtitle?: string;
  progressPercent?: number;
  onRemove?: () => void;
  removeLabel?: string;
}

// Horizontal list-item card -- title, then category/read-time/18+ on one meta
// line, then an optional progress bar or subtitle, then an optional actions
// menu. For anywhere a story needs to read as a scannable list row rather
// than the poster-style StoryCard's grid/carousel look -- currently Library's
// Continue Reading/Saved/Downloads/Completed sections, which previously had
// this exact layout duplicated privately as `LibraryRow` with no read-time or
// mature-content indicator.
export function StoryRowCard({ story, subtitle, progressPercent, onRemove, removeLabel }: StoryRowCardProps) {
  const { labels: categoryLabels } = useCategories();
  const theme = useTheme();
  const hasProgress = progressPercent !== undefined;
  const [menuOpen, setMenuOpen] = useState(false);

  function openStory() {
    setMenuOpen(false);
    router.push({ pathname: '/story/[id]', params: { id: story.id } });
  }

  function handleRemove() {
    setMenuOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove?.();
  }

  function openMenu() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen(true);
  }

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
        <Pressable style={styles.rowPressable}>
          {story.image_url && (
            <Image source={{ uri: story.image_url }} style={styles.thumb} contentFit="cover" />
          )}
          <ThemedView style={styles.rowBody}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {story.title}
            </ThemedText>
            <ThemedView style={styles.metaRow}>
              <ThemedText type="small" style={styles.categoryTag}>
                {(categoryLabels[story.category] ?? story.category).toUpperCase()}
              </ThemedText>
              <ThemedText type="small" style={styles.readTime}>
                · {estimateReadMinutes(story.body)} min read
              </ThemedText>
              {story.is_mature && (
                <ThemedView style={styles.matureBadge}>
                  <ThemedText style={styles.matureBadgeText}>18+</ThemedText>
                </ThemedView>
              )}
            </ThemedView>
            {hasProgress ? (
              <>
                <ThemedView style={styles.progressTrack}>
                  <ThemedView style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </ThemedView>
                <ThemedText type="small" style={styles.progressLabel}>
                  {progressPercent}% read
                </ThemedText>
              </>
            ) : subtitle ? (
              <ThemedText type="small" style={styles.progressLabel}>
                {subtitle}
              </ThemedText>
            ) : null}
          </ThemedView>
        </Pressable>
      </Link>
      {onRemove && (
        <Pressable style={styles.menuButton} onPress={openMenu} accessibilityLabel="More actions">
          <Ionicons name="ellipsis-vertical" size={18} color="#8a8a8e" />
        </Pressable>
      )}

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <ThemedView type="backgroundElement" style={styles.menuSheet} onStartShouldSetResponder={() => true}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.menuTitle}>
              {story.title}
            </ThemedText>
            <Pressable style={styles.menuItem} onPress={openStory}>
              <Ionicons name="book-outline" size={18} color={theme.text} />
              <ThemedText style={styles.menuItemText}>Open Story</ThemedText>
            </Pressable>
            {onRemove && (
              <Pressable style={styles.menuItem} onPress={handleRemove}>
                <Ionicons name="trash-outline" size={18} color="#C01918" />
                <ThemedText style={[styles.menuItemText, styles.menuItemDestructiveText]}>
                  {removeLabel ?? 'Remove'}
                </ThemedText>
              </Pressable>
            )}
            <Pressable style={styles.menuCancel} onPress={() => setMenuOpen(false)}>
              <ThemedText type="smallBold" style={styles.menuCancelText}>
                Cancel
              </ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: Spacing.two,
    overflow: 'hidden',
  },
  rowPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  rowBody: { flex: 1, gap: 4, backgroundColor: 'transparent' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  categoryTag: { color: '#C01918', fontWeight: '700', fontSize: 11 },
  readTime: { opacity: 0.6, fontSize: 11 },
  matureBadge: {
    marginLeft: 2,
    paddingHorizontal: 3,
    borderRadius: 4,
    backgroundColor: '#C01918',
  },
  matureBadgeText: { color: '#fff', fontWeight: '700', fontSize: 10 },
  progressTrack: { height: 4, backgroundColor: 'rgba(128,128,128,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#C01918' },
  progressLabel: { opacity: 0.6, fontSize: 12 },
  menuButton: { paddingHorizontal: Spacing.three, alignSelf: 'stretch', justifyContent: 'center' },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  menuTitle: { opacity: 0.6, marginBottom: Spacing.two },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingVertical: Spacing.three,
  },
  menuItemText: { fontSize: 16 },
  menuItemDestructiveText: { color: '#C01918' },
  menuCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  menuCancelText: { opacity: 0.6 },
});
