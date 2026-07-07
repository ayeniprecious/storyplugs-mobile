import type { Story, StoryLengthPref } from "@/lib/database.types";

// Rough word-count buckets used to match a story against story_length_pref.
function matchesLength(story: Story, pref: StoryLengthPref): boolean {
  const words = story.body.trim().split(/\s+/).length;
  if (pref === "short") return words <= 700;
  if (pref === "medium") return words > 700 && words <= 1800;
  return words > 1800; // long
}

/**
 * Builds the "Recommended for You" row from onboarding preferences:
 * round-robins across the user's interest categories (for variety), then
 * floats stories matching their preferred length to the front (stable sort,
 * so the category mix is kept within each group). Returns [] when the user
 * hasn't picked interests, so the row simply doesn't render.
 */
export function buildRecommendations(
  byCategory: Record<string, Story[]>,
  interests: string[] | null | undefined,
  lengthPref: StoryLengthPref | null | undefined,
  excludeId?: string,
  limit = 12
): Story[] {
  if (!interests || interests.length === 0) return [];

  const queues = interests.map((slug) =>
    (byCategory[slug] ?? []).filter((story) => story.id !== excludeId)
  );
  const picks: Story[] = [];
  while (picks.length < limit && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const story = queue.shift();
      if (story) picks.push(story);
      if (picks.length >= limit) break;
    }
  }

  if (lengthPref && lengthPref !== "any") {
    picks.sort(
      (a, b) => Number(matchesLength(b, lengthPref)) - Number(matchesLength(a, lengthPref))
    );
  }
  return picks;
}
