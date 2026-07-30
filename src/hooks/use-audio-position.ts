import AsyncStorage from '@react-native-async-storage/async-storage';

// Local-only, per-story playback position (in seconds) for the recorded-audio
// narration player -- lets pause/resume survive navigating away and back, or
// closing and reopening the app, not just staying paused within one mounted
// screen. Mirrors use-mood-checkin.ts's plain-AsyncStorage approach; no
// Supabase table since this is a resume convenience, not data worth syncing
// across devices.
function audioPositionKey(storyId: string) {
  return `storyplugs:audio-position:${storyId}`;
}

// Resuming from the very tail end of a track would just replay the last
// second and then immediately hit the end -- treat anything this close to
// finished as "start over" instead.
const MIN_RESUMABLE_SECONDS = 3;

export async function getAudioPosition(storyId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(audioPositionKey(storyId));
    if (!raw) return 0;
    const seconds = Number(raw);
    return Number.isFinite(seconds) && seconds > MIN_RESUMABLE_SECONDS ? seconds : 0;
  } catch {
    return 0;
  }
}

export async function saveAudioPosition(storyId: string, positionSeconds: number) {
  try {
    await AsyncStorage.setItem(audioPositionKey(storyId), String(positionSeconds));
  } catch {
    // Best-effort -- losing the resume point isn't worth surfacing to the user.
  }
}

export async function clearAudioPosition(storyId: string) {
  try {
    await AsyncStorage.removeItem(audioPositionKey(storyId));
  } catch {
    // Best-effort, same as above.
  }
}
