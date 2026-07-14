// Hand-written subset of the Supabase schema, extended as later phases touch more tables.
// Source of truth: storyplugs-supabase/supabase/migrations/20260704000000_init_schema.sql

export type NotificationContentType =
  | "story_of_day"
  | "kindness_quote"
  | "daily_reflection"
  | "faith_encouragement";

export type StoryLengthPref = "short" | "medium" | "long" | "any";

export interface Profile {
  id: string;
  display_name: string | null;
  // 20260721000000_display_name_change_lock.sql — null means never changed via the app yet.
  display_name_changed_at: string | null;
  avatar_url: string | null;
  // null means "Anytime" -- no specific delivery-time preference.
  notification_time: string | null;
  notification_types: NotificationContentType[];
  push_token: string | null;
  gender: string | null;
  date_of_birth: string | null;
  // Personalization (20260715000000_personalization.sql) — category slugs, goal ids, length pref.
  interests: string[];
  personal_goals: string[];
  story_length_pref: StoryLengthPref | null;
  // Privacy (20260719000000_comment_identity_and_feedback.sql).
  hide_identity_in_comments: boolean;
  // Gates Reader Mode -- admin-toggled only, see protect_is_premium() trigger.
  is_premium: boolean;
  // Streak Freeze (20260726000000_streak_freeze.sql) -- server-write-only, see
  // use_streak_freeze() RPC; the authenticated role has UPDATE revoked on these two.
  streak_freezes_available: number;
  streak_freezes_reset_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ContentStatus = "draft" | "pending_review" | "approved" | "published" | "archived";

export interface Category {
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface Story {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  audio_url: string | null;
  category: string;
  reflection_question: string | null;
  daily_lesson: string | null;
  source: "manual" | "ai_generated";
  status: ContentStatus;
  is_featured: boolean;
  is_pinned: boolean;
  // 20260728000000_story_mature_flag.sql -- admin-editable, drives the "18+" badge.
  is_mature: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // 20260730000000_story_tags.sql -- only populated when fetched from the
  // `stories_with_tags` view (currently just useAllStories); plain `stories`
  // table/embed fetches elsewhere in the app leave this undefined.
  tags?: string[];
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
  // 20260726000000_streak_freeze.sql — true when this day was backfilled by a
  // Streak Freeze rather than real activity.
  is_freeze: boolean;
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

export interface Comment {
  id: string;
  story_id: string;
  user_id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  is_anonymous: boolean;
}

export interface Feedback {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: string | null;
  updated_at: string;
}

export type ReportTargetType = "story" | "comment" | "user";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

export interface Report {
  id: string;
  reporter_user_id: string | null;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  reviewed_by_admin_id: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// 20260727000000_journal_entries.sql — premium-gated on insert only (see the
// journal_entries_insert_own_premium RLS policy); story_title/reflection_question
// are snapshots taken at write time, not a live join to stories.
export interface JournalEntry {
  id: string;
  user_id: string;
  story_id: string | null;
  story_title: string;
  reflection_question: string;
  entry: string;
  created_at: string;
  updated_at: string;
}

// 20260729000000_curated_sections.sql — admin-controlled rows placed at named
// anchor points on Home/Search. `anchor` values are documented in
// use-curated-sections.ts alongside the anchor constants each screen reads.
export type CuratedSectionPage = "home" | "search";
export type CuratedSectionStyle = "poster" | "row" | "ranked";

export interface CuratedSection {
  id: string;
  title: string;
  target_page: CuratedSectionPage;
  anchor: string;
  display_style: CuratedSectionStyle;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CuratedSectionStory {
  id: string;
  section_id: string;
  story_id: string;
  sort_order: number;
}

// 20260801000000_story_folders.sql — user-created collections, plain
// auth.uid() = user_id ownership (no admin involvement, unlike curated
// sections). story_folder_items has no id/primary key column of its own --
// (folder_id, story_id) is the primary key.
export interface StoryFolder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface StoryFolderItem {
  folder_id: string;
  story_id: string;
  added_at: string;
}
