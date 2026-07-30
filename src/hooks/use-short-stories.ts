import { useMemo } from "react";

import { useAllStories } from "@/hooks/use-all-stories";
import type { Story } from "@/lib/database.types";

// Derives the flat, newest-first list of short stories from the already-
// prefetched all-stories cache (useAllStories) rather than a separate
// network round trip -- reused by Home's endless row and the View All page.
export function useShortStories() {
  const { byCategory, loading, error, refresh } = useAllStories();

  const stories = useMemo(() => {
    const all: Story[] = Object.values(byCategory).flat();
    return all
      .filter((story) => story.is_short_story)
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  }, [byCategory]);

  return { stories, loading, error, refresh };
}
