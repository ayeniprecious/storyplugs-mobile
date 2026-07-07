import { useCallback, useEffect, useState } from "react";

import { pickOfTheDay } from "@/lib/daily-pick";
import { pickWithoutRepeat } from "@/lib/rotation-pick";
import type { Quote, Reflection, Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface DailyContentState {
  story: Story | null;
  quote: Quote | null;
  reflection: Reflection | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDailyContent(): DailyContentState {
  const [story, setStory] = useState<Story | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [storiesRes, quotesRes, reflectionsRes] = await Promise.all([
      supabase.from("stories").select("*").eq("status", "published").order("id"),
      supabase.from("quotes").select("*").eq("status", "published").order("id"),
      supabase.from("reflections").select("*").eq("status", "published").order("id"),
    ]);

    const firstError = storiesRes.error || quotesRes.error || reflectionsRes.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const today = new Date();
    setStory(pickOfTheDay((storiesRes.data as Story[]) ?? [], today));
    // Quotes/reflections rotate randomly without repeating until every one
    // has been shown (see rotation-pick.ts) — story-of-the-day stays on the
    // deterministic same-for-everyone pick above.
    const [quotePick, reflectionPick] = await Promise.all([
      pickWithoutRepeat("daily_rotation_quote", (quotesRes.data as Quote[]) ?? [], today),
      pickWithoutRepeat("daily_rotation_reflection", (reflectionsRes.data as Reflection[]) ?? [], today),
    ]);
    setQuote(quotePick);
    setReflection(reflectionPick);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { story, quote, reflection, loading, error, refresh };
}
