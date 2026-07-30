import type { Story } from '@/lib/database.types';

// The StoryCard component itself was retired in favor of BookCoverCard
// (book-cover-card.tsx) everywhere it was used -- this file now only holds
// the "New" badge window/helper, still shared by search.tsx and
// ranked-story-row.tsx.
export const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isNewStory(story: Story) {
  if (!story.published_at) return false;
  return Date.now() - new Date(story.published_at).getTime() < NEW_WINDOW_MS;
}
