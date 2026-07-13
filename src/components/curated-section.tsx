import { StyleSheet } from 'react-native';

import { CategoryRow } from '@/components/category-row';
import { RankedStoryList } from '@/components/ranked-story-list';
import { StoryRowCard } from '@/components/story-row-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ResolvedCuratedSection } from '@/hooks/use-curated-sections';

// Renders one admin-created section in whichever of the app's three existing
// card styles it was assigned. `poster`/`ranked` are just CategoryRow/
// RankedStoryList (unchanged, reused as-is); `row` has no shared list wrapper
// yet (per this session's research into StoryRowCard's usage), so it's a
// small inline branch here rather than a new exported component until a
// second consumer needs one.
export function CuratedSection({ section }: { section: ResolvedCuratedSection }) {
  if (section.display_style === 'poster') {
    return <CategoryRow label={section.title} stories={section.stories} />;
  }

  if (section.display_style === 'ranked') {
    return <RankedStoryList label={section.title} stories={section.stories} />;
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
});
