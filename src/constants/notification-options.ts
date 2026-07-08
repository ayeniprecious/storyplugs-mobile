import type { NotificationContentType } from "@/lib/database.types";

export const CONTENT_TYPE_OPTIONS: { value: NotificationContentType; label: string; blurb: string }[] = [
  { value: "story_of_day", label: "Story of the Day", blurb: "A real human-interest story every day" },
  { value: "kindness_quote", label: "Kindness Quote", blurb: "A short line to carry with you" },
  { value: "daily_reflection", label: "Daily Reflection", blurb: "A question worth sitting with" },
  { value: "faith_encouragement", label: "Faith Encouragement", blurb: "Gentle words for the journey" },
];

// "anytime" is a sentinel, not a real time-of-day -- stored as notification_time
// = null (see 20260720000000_anytime_notification_time.sql). It's the default.
export const TIME_SLOT_OPTIONS: { value: string; label: string }[] = [
  { value: "anytime", label: "Anytime" },
  { value: "06:00", label: "6:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "21:00", label: "9:00 PM" },
];
