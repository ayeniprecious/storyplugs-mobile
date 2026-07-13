import type { MoodOption } from "@/constants/mood-options";
import type { Story } from "@/lib/database.types";

function scoreStory(story: Story, mood: MoodOption, selectedCategories: string[]): number {
  let score = 0;
  if (selectedCategories.includes(story.category)) score += 3;
  if (mood.categoryBoost.includes(story.category)) score += 2;

  // Admin-entered tags (e.g. a Kindness story tagged "gifting, mercy, loyalty")
  // are a sharper signal than category alone. An exact tag match on one of the
  // mood's keywords counts more than the same word merely appearing in prose.
  const tags = (story.tags ?? []).map((tag) => tag.toLowerCase());
  if (mood.keywords.some((keyword) => tags.includes(keyword.toLowerCase()))) score += 2;

  const haystack = `${story.title} ${story.daily_lesson ?? ""} ${story.reflection_question ?? ""} ${tags.join(" ")}`.toLowerCase();
  if (mood.keywords.some((keyword) => haystack.includes(keyword))) score += 1;

  return score;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Scores every story against the chosen mood + optional category picks
 * rather than hard-filtering to only matches -- nothing is excluded,
 * everything is ranked. The last ~quarter of the result is deliberately
 * backfilled from stories outside the top-scored set (shuffled) so the
 * picks never become a closed loop of only-what-you-said.
 */
export function buildMoodPicks(
  allStories: Story[],
  mood: MoodOption,
  selectedCategories: string[],
  excludeIds: string[] = [],
  limit = 12
): Story[] {
  const pool = shuffle(allStories.filter((story) => !excludeIds.includes(story.id)));
  if (pool.length === 0) return [];

  // Shuffling before the (stable) sort means equally-scored stories land in
  // random relative order -- without this, ties would resolve the same way
  // every call and a "show different picks" reshuffle would only ever change
  // the last slice reserved for variety, not the top-ranked ones.
  const scored = pool
    .map((story) => ({ story, score: scoreStory(story, mood, selectedCategories) }))
    .sort((a, b) => b.score - a.score);

  const varietySlots = Math.max(1, Math.round(limit * 0.25));
  const topSlots = Math.max(0, limit - varietySlots);

  const top = scored.slice(0, topSlots).map((s) => s.story);
  const variety = shuffle(scored.slice(topSlots).map((s) => s.story));

  return [...top, ...variety].slice(0, limit);
}
