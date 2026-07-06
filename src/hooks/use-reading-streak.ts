import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayCount(dateStr: string) {
  // activity_date comes back as "YYYY-MM-DD"; parse as UTC midnight so day-diff math is exact.
  return Math.round(new Date(`${dateStr}T00:00:00Z`).getTime() / DAY_MS);
}

function computeStreaks(sortedDates: string[]) {
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const gap = toDayCount(sortedDates[i]) - toDayCount(sortedDates[i - 1]);
    run = gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const todayCount = Math.round(Date.now() / DAY_MS);
  const lastCount = toDayCount(sortedDates[sortedDates.length - 1]);
  let current = 0;
  if (todayCount - lastCount <= 1) {
    current = 1;
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const gap = toDayCount(sortedDates[i]) - toDayCount(sortedDates[i - 1]);
      if (gap === 1) current++;
      else break;
    }
  }

  return { current, longest };
}

export function useReadingStreak() {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setCurrentStreak(0);
      setLongestStreak(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("reading_activity")
      .select("activity_date")
      .eq("user_id", user.id)
      .order("activity_date", { ascending: true });

    const dates = ((data as { activity_date: string }[] | null) ?? []).map((r) => r.activity_date);
    const { current, longest } = computeStreaks(dates);
    setCurrentStreak(current);
    setLongestStreak(longest);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { currentStreak, longestStreak, loading, refresh };
}
