import { ScrollView, StyleSheet } from 'react-native';

import { StoryCard } from '@/components/story-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Story } from '@/lib/database.types';

export function CategoryRow({ label, stories }: { label: string; stories: Story[] }) {
  if (stories.length === 0) return null;

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold" style={styles.heading}>
        {label}
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two, marginBottom: Spacing.two },
  heading: { opacity: 0.85 },
});
