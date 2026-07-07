import type { Ionicons } from "@expo/vector-icons";

import type { StoryLengthPref } from "@/lib/database.types";

type IoniconName = keyof typeof Ionicons.glyphMap;

// "What brings you here?" — stored in profiles.personal_goals
export const GOAL_OPTIONS: { value: string; label: string; blurb: string; icon: IoniconName }[] = [
  {
    value: "daily_inspiration",
    label: "Start my day inspired",
    blurb: "A little lift every morning",
    icon: "sunny-outline",
  },
  {
    value: "find_peace",
    label: "Find calm in tough moments",
    blurb: "Stories that bring peace",
    icon: "leaf-outline",
  },
  {
    value: "grow_faith",
    label: "Grow my faith",
    blurb: "Encouragement for the journey",
    icon: "heart-outline",
  },
  {
    value: "restore_hope",
    label: "See the good in people",
    blurb: "Real kindness, real hope",
    icon: "people-outline",
  },
  {
    value: "build_habit",
    label: "Build a daily reading habit",
    blurb: "A few mindful minutes a day",
    icon: "book-outline",
  },
  {
    value: "share_with_family",
    label: "Share stories with loved ones",
    blurb: "Moments worth passing on",
    icon: "home-outline",
  },
];

// Preferred story length — stored in profiles.story_length_pref
export const STORY_LENGTH_OPTIONS: { value: StoryLengthPref; label: string; blurb: string }[] = [
  { value: "short", label: "Quick reads", blurb: "2–3 minutes" },
  { value: "medium", label: "A steady read", blurb: "5–7 minutes" },
  { value: "long", label: "Deep dives", blurb: "10+ minutes" },
  { value: "any", label: "Surprise me", blurb: "A mix of everything" },
];
