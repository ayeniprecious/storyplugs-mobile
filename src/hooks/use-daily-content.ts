import { useCallback, useEffect, useState } from "react";

import { pickOfTheDay } from "@/lib/daily-pick";
import { pickWithoutRepeat } from "@/lib/rotation-pick";
import type { Quote, Reflection, Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface DailyContentResult {
  story: Story | null;
  quote: Quote | null;
  reflection: Reflection | null;
  error: string | null;
}

async function fetchDailyContent(): Promise<DailyContentResult> {
  try {
    const [storiesRes, quotesRes, reflectionsRes] = await Promise.all([
      supabase.from("stories").select("*").eq("status", "published").order("id"),
      supabase.from("quotes").select("*").eq("status", "published").order("id"),
      supabase.from("reflections").select("*").eq("status", "published").order("id"),
    ]);

    const firstError = storiesRes.error || quotesRes.error || reflectionsRes.error;
    if (firstError) {
      return { story: null, quote: null, reflection: null, error: firstError.message };
    }

    const today = new Date();
    const story = pickOfTheDay((storiesRes.data as Story[]) ?? [], today);
    // Quotes/reflections rotate randomly without repeating until every one
    // has been shown (see rotation-pick.ts) — story-of-the-day stays on the
    // deterministic same-for-everyone pick above.
    const [quote, reflection] = await Promise.all([
      pickWithoutRepeat("daily_rotation_quote", (quotesRes.data as Quote[]) ?? [], today),
      pickWithoutRepeat("daily_rotation_reflection", (reflectionsRes.data as Reflection[]) ?? [], today),
    ]);

    return { story, quote, reflection, error: null };
  } catch (err) {
    // A network-level failure (not a Supabase API error, which is handled
    // above) would otherwise reject this promise -- harmless in the browser,
    // but this same function also runs during Expo Router's Node-side SSR
    // prerender (see the isBrowser guard below and the matching one in
    // lib/supabase.ts), where an unhandled rejection crashes the whole dev
    // server process. Always resolve.
    return {
      story: null,
      quote: null,
      reflection: null,
      error: err instanceof Error ? err.message : "Failed to load daily content.",
    };
  }
}

const isBrowser = typeof window !== "undefined";

// Story/quote/reflection status='published' rows are publicly readable (no
// auth in the RLS policy), so this doesn't need to wait for a session --
// prefetchDailyContent() is called at module load in app/_layout.tsx, which
// runs before the branded splash even starts its minimum-display timer. By
// the time Home mounts (after auth + profile resolve and routing settles),
// this is usually already resolved, so the hook below renders real content
// immediately instead of a skeleton.
let inFlight: Promise<DailyContentResult> | null = null;

export function prefetchDailyContent(): Promise<DailyContentResult> {
  // No-op during Node SSR (this module's prefetch call runs at import time,
  // which SSR also triggers) -- there's nothing to render server-side here,
  // and this sandbox specifically can't reach Supabase from Node at all.
  if (!isBrowser) {
    return Promise.resolve({ story: null, quote: null, reflection: null, error: null });
  }
  if (!inFlight) inFlight = fetchDailyContent();
  return inFlight;
}

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

  const applyResult = useCallback((result: DailyContentResult) => {
    setStory(result.story);
    setQuote(result.quote);
    setReflection(result.reflection);
    setError(result.error);
    setLoading(false);
  }, []);

  // Explicit refresh (pull-to-refresh) always does a real fresh fetch --
  // reusing the prefetched/cached promise here would make "refresh" a no-op.
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    applyResult(await fetchDailyContent());
  }, [applyResult]);

  useEffect(() => {
    prefetchDailyContent().then(applyResult);
  }, [applyResult]);

  return { story, quote, reflection, loading, error, refresh };
}
