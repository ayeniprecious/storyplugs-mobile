import { StyleSheet } from 'react-native';

import { RankedStoryRow } from '@/components/ranked-story-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Story } from '@/lib/database.types';

// Same label/stories API shape as CategoryRow, so it's a drop-in swap wherever
// a horizontal poster carousel should read as a numbered list instead.
export function RankedStoryList({ label, stories }: { label: string; stories: Story[] }) {
  if (stories.length === 0) return null;

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold" style={styles.heading}>
        {label}
      </ThemedText>
      {stories.map((story, i) => (
        <RankedStoryRow key={story.id} story={story} rank={i + 1} isLast={i === stories.length - 1} />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.two },
  heading: { opacity: 0.85, marginBottom: Spacing.two },
});
