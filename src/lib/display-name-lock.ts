// Display name can only be changed once every 6 months (profiles.display_name_changed_at).
// Calendar-month arithmetic rather than a fixed day count, so it lands on the
// same day-of-month regardless of which months it spans.
export function getNextNameChangeDate(lastChangedAt: string | null): Date | null {
  if (!lastChangedAt) return null;
  const next = new Date(lastChangedAt);
  next.setMonth(next.getMonth() + 6);
  return next;
}

export function canChangeDisplayName(lastChangedAt: string | null): boolean {
  const next = getNextNameChangeDate(lastChangedAt);
  return next === null || Date.now() >= next.getTime();
}
