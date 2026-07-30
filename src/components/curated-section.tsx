import { FlatList, StyleSheet } from 'react-native';

import { CategoryRow } from '@/components/category-row';
import { RankedStoryList } from '@/components/ranked-story-list';
import { ShortStoryCard } from '@/components/short-story-card';
import { StoryRowCard } from '@/components/story-row-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ResolvedCuratedSection } from '@/hooks/use-curated-sections';

// Renders one admin-created section in whichever of the app's card styles it
// was assigned. `poster`/`ranked` are just CategoryRow/RankedStoryList
// (unchanged, reused as-is); `row` and `short` have no shared list wrapper
// yet, so they're small inline branches here rather than new exported
// components until a second consumer needs one.
export function CuratedSection({ section }: { section: ResolvedCuratedSection }) {
  if (section.display_style === 'poster') {
    return <CategoryRow label={section.title} stories={section.stories} />;
  }

  if (section.display_style === 'ranked') {
    return <RankedStoryList label={section.title} stories={section.stories} />;
  }

  if (section.display_style === 'short') {
    return (
      <ThemedView style={styles.section}>
        <ThemedText type="smallBold" style={styles.heading}>
          {section.title}
        </ThemedText>
        <FlatList
          data={section.stories}
          keyExtractor={(story) => story.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortRow}
          renderItem={({ item }) => <ShortStoryCard story={item} />}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold" style={styles.heading}>
        {section.title}
      </ThemedText>
      {section.stories.map((story) => (
        <StoryRowCard key={story.id} story={story} />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.two },
  heading: { opacity: 0.85, marginBottom: Spacing.two },
  shortRow: { gap: Spacing.two },
});
