import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { isNewStory } from '@/components/story-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useFavorite } from '@/hooks/use-favorite';
import { useTheme } from '@/hooks/use-theme';
import type { Story } from '@/lib/database.types';
import { estimateReadMinutes } from '@/lib/read-time';

interface RankedStoryRowProps {
  story: Story;
  rank: number;
  isLast?: boolean;
}

// Wattpad-style ranked list row: bold position number, book-cover thumbnail,
// title, a small stats line, and a row of tag pills -- deliberately NOT
// wrapped in a background-filled card (unlike StoryRowCard's "library type"),
// rows sit directly on the screen background and are separated by a hairline
// divider instead. StoryPlugs has no author field or view-count aggregate, so
// the byline/view-count Wattpad shows are replaced with what real data
// supports: a read-time estimate, a category/18+ tag row, and a New badge on
// the cover thumbnail itself -- same treatment as StoryCard's poster badge,
// rather than one more tag pill.
//
// The save (bookmark) button sits as a sibling of the <Link asChild> block,
// not nested inside it -- same fix as StoryRowCard's remove button, since a
// Pressable nested inside a Link's Pressable also fires the outer navigation
// on tap in RNW.
export function RankedStoryRow({ story, rank, isLast }: RankedStoryRowProps) {
  const { labels: categoryLabels } = useCategories();
  const theme = useTheme();
  const { isFavorited, toggle: toggleFavorite } = useFavorite(story.id);

  function handleSavePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite();
  }

  return (
    <View
      style={StyleSheet.flatten([
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ])}
    >
      <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
        <Pressable style={styles.rowPressable}>
          <ThemedText style={styles.rank}>{rank}</ThemedText>
          <View style={styles.thumbWrap}>
            {story.image_url && <Image source={{ uri: story.image_url }} style={styles.thumb} contentFit="cover" />}
            {isNewStory(story) && (
              <ThemedView style={styles.newBadge}>
                <ThemedText style={styles.newBadgeText}>New</ThemedText>
              </ThemedView>
            )}
          </View>
          <ThemedView style={styles.body}>
            <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
              {story.title}
            </ThemedText>
            <ThemedView style={styles.statsRow}>
              <Ionicons name="time-outline" size={12} color={theme.placeholder} />
              <ThemedText type="small" style={styles.statText}>
                {estimateReadMinutes(story.body)} min read
              </ThemedText>
            </ThemedView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagScroll}
              contentContainerStyle={styles.tagRow}
            >
              <View style={styles.tag}>
                <ThemedText type="small" style={styles.tagText}>
                  {categoryLabels[story.category] ?? story.category}
                </ThemedText>
              </View>
              {story.is_mature && (
                <View style={[styles.tag, styles.matureTag]}>
                  <ThemedText type="small" style={styles.matureTagText}>
                    18+
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Link>
      <Pressable
        style={styles.saveButton}
        onPress={handleSavePress}
        hitSlop={8}
        accessibilityLabel={isFavorited ? 'Remove from My List' : 'Save to My List'}
      >
        <Ionicons
          name={isFavorited ? 'bookmark' : 'bookmark-outline'}
          size={19}
          color={isFavorited ? '#C01918' : theme.placeholder}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two + 4,
  },
  rowPressable: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  saveButton: { padding: 6 },
  rank: { fontSize: 22, fontWeight: '700', width: 26, textAlign: 'center' },
  thumbWrap: { width: 64, height: 92, borderRadius: 6, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  newBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#C01918',
    borderBottomLeftRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  newBadgeText: { color: '#fff', fontSize: 9, lineHeight: 11, fontWeight: '700' },
  body: { flex: 1, gap: 4, backgroundColor: 'transparent' },
  title: { fontSize: 15, lineHeight: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  statText: { opacity: 0.6, fontSize: 12 },
  // Same flexGrow/flexShrink opt-out learned the hard way on Search's category
  // tab row -- cheap insurance even though this one is nested in content flow
  // (like CategoryRow's own horizontal scroll) rather than a direct sibling of
  // the page's main ScrollView, so it's less likely to hit that exact bug.
  tagScroll: { flexGrow: 0, flexShrink: 0 },
  tagRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  tagText: { fontSize: 11 },
  matureTag: { backgroundColor: '#C01918' },
  matureTagText: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
