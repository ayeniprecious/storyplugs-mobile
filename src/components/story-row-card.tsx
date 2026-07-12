import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
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
// line, then an optional progress bar or subtitle, then an optional remove
// button. For anywhere a story needs to read as a scannable list row rather
// than the poster-style StoryCard's grid/carousel look -- currently Library's
// Continue Reading/Saved/Downloads/Completed sections, which previously had
// this exact layout duplicated privately as `LibraryRow` with no read-time or
// mature-content indicator.
export function StoryRowCard({ story, subtitle, progressPercent, onRemove, removeLabel }: StoryRowCardProps) {
  const { labels: categoryLabels } = useCategories();
  const hasProgress = progressPercent !== undefined;

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
        <Pressable style={styles.removeButton} onPress={onRemove} accessibilityLabel={removeLabel}>
          <Ionicons name="close" size={18} color="#8a8a8e" />
        </Pressable>
      )}
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
    paddingHorizontal: 5,
    borderRadius: 4,
    backgroundColor: '#C01918',
  },
  matureBadgeText: { color: '#fff', fontWeight: '700', fontSize: 10 },
  progressTrack: { height: 4, backgroundColor: 'rgba(128,128,128,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#C01918' },
  progressLabel: { opacity: 0.6 },
  removeButton: { paddingHorizontal: Spacing.three, alignSelf: 'stretch', justifyContent: 'center' },
});
