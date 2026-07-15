import { estimateReadMinutes } from '@/lib/read-time';

export type RecapPeriod = 'month' | 'year';

export interface RecapCompletedStory {
  category: string;
  body: string;
}

export interface RecapJournalEntry {
  storyTitle: string;
  entry: string;
}

export interface RecapData {
  period: RecapPeriod;
  periodLabel: string;
  storiesRead: number;
  minutesRead: number;
  daysActive: number;
  longestStreak: number;
  topCategory: { slug: string; count: number } | null;
  journalCount: number;
  highlightEntry: RecapJournalEntry | null;
}

export function getPeriodRange(period: RecapPeriod, reference: Date = new Date()) {
  if (period === 'month') {
    const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
    const label = start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    return { start, end, label };
  }
  const start = new Date(reference.getFullYear(), 0, 1);
  const end = new Date(reference.getFullYear() + 1, 0, 1);
  return { start, end, label: String(reference.getFullYear()) };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayCount(dateStr: string) {
  return Math.round(new Date(`${dateStr}T00:00:00Z`).getTime() / DAY_MS);
}

// Longest run of consecutive calendar days within the given (already
// deduped) date list -- deliberately not "current streak" (that concept
// only makes sense relative to today, not a bounded past period).
export function longestConsecutiveRun(sortedDates: string[]) {
  if (sortedDates.length === 0) return 0;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const gap = toDayCount(sortedDates[i]) - toDayCount(sortedDates[i - 1]);
    run = gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

export function buildRecap(
  period: RecapPeriod,
  periodLabel: string,
  completedStories: RecapCompletedStory[],
  activityDates: string[],
  journalEntries: RecapJournalEntry[]
): RecapData {
  const storiesRead = completedStories.length;
  const minutesRead = completedStories.reduce((sum, s) => sum + estimateReadMinutes(s.body), 0);

  const uniqueDates = [...new Set(activityDates)].sort();
  const daysActive = uniqueDates.length;
  const longestStreak = longestConsecutiveRun(uniqueDates);

  const categoryCounts = new Map<string, number>();
  for (const s of completedStories) {
    categoryCounts.set(s.category, (categoryCounts.get(s.category) ?? 0) + 1);
  }
  let topCategory: { slug: string; count: number } | null = null;
  for (const [slug, count] of categoryCounts) {
    if (!topCategory || count > topCategory.count) topCategory = { slug, count };
  }

  return {
    period,
    periodLabel,
    storiesRead,
    minutesRead,
    daysActive,
    longestStreak,
    topCategory,
    journalCount: journalEntries.length,
    highlightEntry: journalEntries[0] ?? null,
  };
}
