import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "storyplugs:mood-checkin";

// Same day-string convention as src/lib/rotation-pick.ts's todayString().
function todayString(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

interface MoodCheckinRecord {
  date: string;
  mood: string;
  categories: string[];
}

// Local-only, same-day signal -- no Supabase table, no cross-device sync.
// Mirrors rotation-pick.ts's date-comparison approach for "already happened
// today," just for a modal-answered flag instead of a content pick.
export function useMoodCheckin() {
  const [record, setRecord] = useState<MoodCheckinRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as MoodCheckinRecord) : null;
      setRecord(parsed && parsed.date === todayString() ? parsed : null);
    } catch {
      setRecord(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveMoodCheckin = useCallback(async (mood: string, categories: string[]) => {
    const next: MoodCheckinRecord = { date: todayString(), mood, categories };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setRecord(next);
  }, []);

  const clearMoodCheckin = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setRecord(null);
  }, []);

  return {
    todaysMood: record?.mood ?? null,
    todaysCategories: record?.categories ?? [],
    hasAnsweredToday: !loading && record !== null,
    loading,
    saveMoodCheckin,
    clearMoodCheckin,
  };
}
