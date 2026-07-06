// Hand-written subset of the Supabase schema, extended as later phases touch more tables.
// Source of truth: storyplugs-supabase/supabase/migrations/20260704000000_init_schema.sql

export type NotificationContentType =
  | "story_of_day"
  | "kindness_quote"
  | "daily_reflection"
  | "faith_encouragement";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  notification_time: string;
  notification_types: NotificationContentType[];
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export type StoryCategory =
  | "kindness"
  | "family"
  | "faith"
  | "forgiveness"
  | "hope"
  | "community"
  | "children"
  | "everyday_heroes";

export type ContentStatus = "draft" | "pending_review" | "approved" | "published" | "archived";

export interface Story {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  audio_url: string | null;
  category: StoryCategory;
  reflection_question: string | null;
  daily_lesson: string | null;
  source: "manual" | "ai_generated";
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string | null;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
}

export interface Reflection {
  id: string;
  text: string;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  target_type: "all" | "user";
  target_user_id: string | null;
  story_id: string | null;
  created_at: string;
}

export interface NotificationRecipient {
  id: string;
  notification_id: string;
  user_id: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ReadingActivity {
  id: string;
  user_id: string;
  activity_date: string;
  created_at: string;
}

export interface StoryChapter {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string | null;
  body: string;
  created_at: string;
}
