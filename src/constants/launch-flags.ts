// Temporary kill-switches for features hidden from the Play Store review
// build -- not deleted, just not rendered, so flipping any of these back to
// true after approval restores the feature exactly as it was. None of these
// touch the backend: the underlying tables/columns/RPCs stay intact, only
// the UI that surfaces them is gated.

export const ENABLE_PROFILE_PICTURE_UPLOAD = false;
export const ENABLE_COMMENTS = false;
export const ENABLE_STREAK_FREEZE = false;
export const ENABLE_COMMUNITY_STORIES = false;
export const ENABLE_OFFLINE_DOWNLOADS = false;

// Was forcing every account to read as Premium during closed testing so
// testers could exercise gated features without a real purchase. Off now
// that submission is imminent -- real premium status (from RevenueCat/the
// profiles table) applies everywhere again.
export const FORCE_PREMIUM_FOR_TESTING = false;
