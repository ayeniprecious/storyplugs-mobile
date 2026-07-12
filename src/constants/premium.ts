// How far back a free (non-premium) account can read into the story catalog.
// Stories published before this window require Premium's Full Archive Access.
// Client-side gate only -- matches the existing Reader Mode precedent, see
// read.tsx's isArchiveLocked. Not enforced in RLS: the story row (and its
// body, for non-chaptered stories) is already fetched via a plain `select('*')`
// before any gating logic runs, so this is a render-time gate, not a
// network-payload one -- same as Reader Mode today.
export const FREE_ARCHIVE_WINDOW_DAYS = 30;

// Premium accounts get this many Streak Freezes per calendar month. See
// use_streak_freeze() in storyplugs-supabase for the server-side allowance.
export const STREAK_FREEZES_PER_MONTH = 2;
