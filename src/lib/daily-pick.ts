// Deterministic "of the day" selection: same item all day for everyone, changes daily,
// with no extra scheduling table needed. Two users opening the app the same day see the same pick.
export function pickOfTheDay<T>(items: T[], date: Date = new Date()): T | null {
  if (items.length === 0) return null;
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  const index = ((dayNumber % items.length) + items.length) % items.length;
  return items[index];
}
