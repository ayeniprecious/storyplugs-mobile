import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { buildRecap, getPeriodRange, type RecapData, type RecapPeriod } from "@/lib/reading-recap";
import { supabase } from "@/lib/supabase";

export function useReadingRecap(period: RecapPeriod) {
  const { user } = useAuth();
  const [data, setData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { start, end, label } = getPeriodRange(period);
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      const startDate = startIso.slice(0, 10);
      const endDate = endIso.slice(0, 10);

      const [viewsResult, activityResult, journalResult] = await Promise.all([
        supabase
          .from("story_views")
          .select("updated_at, stories(category, body)")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("updated_at", startIso)
          .lt("updated_at", endIso),
        supabase
          .from("reading_activity")
          .select("activity_date")
          .eq("user_id", user.id)
          .gte("activity_date", startDate)
          .lt("activity_date", endDate),
        supabase
          .from("journal_entries")
          .select("story_title, entry, created_at")
          .eq("user_id", user.id)
          .gte("created_at", startIso)
          .lt("created_at", endIso)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;

      const completedStories = (
        (viewsResult.data as unknown as { stories: { category: string; body: string } | null }[]) ?? []
      )
        .filter((row) => row.stories)
        .map((row) => ({ category: row.stories!.category, body: row.stories!.body }));
      const activityDates = ((activityResult.data as { activity_date: string }[] | null) ?? []).map(
        (r) => r.activity_date
      );
      const journalEntries = (
        (journalResult.data as { story_title: string; entry: string }[] | null) ?? []
      ).map((r) => ({ storyTitle: r.story_title, entry: r.entry }));

      setData(buildRecap(period, label, completedStories, activityDates, journalEntries));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, period]);

  return { data, loading };
}
