import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { isNewStory } from '@/components/story-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
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
// supports: a read-time estimate, and tag pills built from category plus the
// New/18+ indicators that already exist elsewhere in the app.
export function RankedStoryRow({ story, rank, isLast }: RankedStoryRowProps) {
  const { labels: categoryLabels } = useCategories();
  const theme = useTheme();

  return (
    <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
      <Pressable
        style={StyleSheet.flatten([
          styles.row,
          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
        ])}
      >
        <ThemedText style={styles.rank}>{rank}</ThemedText>
        {story.image_url && <Image source={{ uri: story.image_url }} style={styles.thumb} contentFit="cover" />}
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
            {isNewStory(story) && (
              <View style={styles.tag}>
                <ThemedText type="small" style={styles.tagText}>
                  New
                </ThemedText>
              </View>
            )}
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 4,
  },
  rank: { fontSize: 22, fontWeight: '700', width: 26, textAlign: 'center' },
  thumb: { width: 64, height: 92, borderRadius: 6 },
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
