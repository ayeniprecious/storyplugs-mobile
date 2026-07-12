// 160 wpm reads as a comfortable, attentive pace for these stories -- fast enough that a
// short story isn't overestimated, slow enough that a longer one doesn't feel rushed.
export function estimateReadMinutes(body: string) {
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 160));
}
