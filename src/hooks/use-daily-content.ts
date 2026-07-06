import { useCallback, useEffect, useState } from "react";

import { pickOfTheDay } from "@/lib/daily-pick";
import type { Quote, Reflection, Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface DailyContentState {
  story: Story | null;
  quote: Quote | null;
  reflection: Reflection | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDailyContent(): DailyContentState {
  const [story, setStory] = useState<Story | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [storiesRes, quotesRes, reflectionsRes] = await Promise.all([
        supabase.from("stories").select("*").eq("status", "published").order("id"),
        supabase.from("quotes").select("*").eq("status", "published").order("id"),
        supabase.from("reflections").select("*").eq("status", "published").order("id"),
      ]);

      if (cancelled) return;

      const firstError = storiesRes.error || quotesRes.error || reflectionsRes.error;
      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      const today = new Date();
      setStory(pickOfTheDay((storiesRes.data as Story[]) ?? [], today));
      setQuote(pickOfTheDay((quotesRes.data as Quote[]) ?? [], today));
      setReflection(pickOfTheDay((reflectionsRes.data as Reflection[]) ?? [], today));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { story, quote, reflection, loading, error, refresh };
}
