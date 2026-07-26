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
