import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useProfile } from "@/context/profile-context";
import { supabase } from "@/lib/supabase";

// Local calendar day, matching how use-record-activity.ts stamps activity_date --
// what matters here is what date rows actually exist from the user's own perspective.
function dateStringDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useStreakFreeze() {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setLastActivityDate(null);
      return;
    }
    const { data } = await supabase
      .from("reading_activity")
      .select("activity_date")
      .eq("user_id", user.id)
      .order("activity_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastActivityDate((data as { activity_date: string } | null)?.activity_date ?? null);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPremium = !!profile?.is_premium;
  const freezesAvailable = profile?.streak_freezes_available ?? 0;
  // Mirrors use_streak_freeze()'s own "no_gap_to_freeze" check: a freeze only makes
  // sense when the streak just broke yesterday and today hasn't been logged yet.
  const canSaveStreak = isPremium && freezesAvailable > 0 && lastActivityDate === dateStringDaysAgo(2);

  const applyFreeze = useCallback(async () => {
    setApplying(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("use_streak_freeze");
    setApplying(false);
    if (rpcError) {
      setError(rpcError.message);
      return { error: rpcError.message };
    }
    await Promise.all([refresh(), refreshProfile()]);
    return { error: null };
  }, [refresh, refreshProfile]);

  return { freezesAvailable, canSaveStreak, applying, error, applyFreeze };
}
