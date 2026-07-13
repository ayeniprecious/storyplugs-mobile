import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "storyplugs:mood-checkin";

// A mood check-in is a same-moment suggestion, not a fixture that should sit
// on Home untouched for the rest of the day -- auto-clear it after this long
// since it was answered, on top of the existing same-day expiry.
const EXPIRY_MS = 6 * 60 * 60 * 1000;
// Home can stay mounted for hours (tab navigators keep screens alive), so
// relying on remount/refocus alone wouldn't catch expiry during a long
// single session -- recheck on an interval too.
const EXPIRY_CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Same day-string convention as src/lib/rotation-pick.ts's todayString().
function todayString(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

interface MoodCheckinRecord {
  date: string;
  mood: string;
  categories: string[];
  answeredAt: number;
}

// Stable reference for the no-record case -- `record?.categories ?? []` would
// otherwise construct a brand new array every render. That's harmless for a
// useMemo consumer, but index.tsx's moodPicks effect depends on this value,
// so a fresh reference every render re-triggers the effect every render,
// which calls setState, which re-renders, forever.
const EMPTY_CATEGORIES: string[] = [];

function isFresh(record: MoodCheckinRecord | null): record is MoodCheckinRecord {
  return (
    record !== null && record.date === todayString() && Date.now() - record.answeredAt < EXPIRY_MS
  );
}

// Local-only, same-day signal -- no Supabase table, no cross-device sync.
// Mirrors rotation-pick.ts's date-comparison approach for "already happened
// today," extended with an inactivity expiry so the suggestion fades on its
// own instead of being a permanent fixture (see clearMoodCheckin for the
// user-initiated version of the same thing).
export function useMoodCheckin() {
  const [record, setRecord] = useState<MoodCheckinRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const applyStoredRecord = useCallback((parsed: MoodCheckinRecord | null) => {
    if (parsed && !isFresh(parsed)) {
      AsyncStorage.removeItem(STORAGE_KEY);
      setRecord(null);
    } else {
      setRecord(parsed);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      applyStoredRecord(raw ? (JSON.parse(raw) as MoodCheckinRecord) : null);
    } catch {
      setRecord(null);
    }
    setLoading(false);
  }, [applyStoredRecord]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        applyStoredRecord(raw ? (JSON.parse(raw) as MoodCheckinRecord) : null);
      });
    }, EXPIRY_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [applyStoredRecord]);

  const saveMoodCheckin = useCallback(async (mood: string, categories: string[]) => {
    const next: MoodCheckinRecord = { date: todayString(), mood, categories, answeredAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setRecord(next);
  }, []);

  // User-initiated version of the same expiry: "I'm done with this" clears it
  // immediately rather than waiting out the inactivity window.
  const clearMoodCheckin = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setRecord(null);
  }, []);

  return {
    todaysMood: record?.mood ?? null,
    todaysCategories: record?.categories ?? EMPTY_CATEGORIES,
    hasAnsweredToday: !loading && record !== null,
    loading,
    saveMoodCheckin,
    clearMoodCheckin,
  };
}
