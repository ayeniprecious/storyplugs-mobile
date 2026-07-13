import { useCallback, useEffect, useState } from "react";

import type { Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface AllStoriesResult {
  byCategory: Record<string, Story[]>;
  error: string | null;
}

async function fetchAllStories(): Promise<AllStoriesResult> {
  try {
    // stories_with_tags is a security_invoker view over stories (same RLS,
    // published-only for this query) that also aggregates each story's tags
    // into a text[] -- lets buildMoodPicks score against tags without every
    // other stories fetch in the app needing to learn the story_tags join.
    const { data, error } = await supabase
      .from("stories_with_tags")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) return { byCategory: {}, error: error.message };

    const byCategory: Record<string, Story[]> = {};
    for (const story of (data as Story[]) ?? []) {
      (byCategory[story.category] ??= []).push(story);
    }
    return { byCategory, error: null };
  } catch (err) {
    // A network-level failure (not a Supabase API error, which is handled
    // above) would otherwise reject this promise -- harmless in the browser,
    // but this same function also runs during Expo Router's Node-side SSR
    // prerender (see the isBrowser guard below and the matching one in
    // lib/supabase.ts), where an unhandled rejection crashes the whole dev
    // server process. Always resolve.
    return {
      byCategory: {},
      error: err instanceof Error ? err.message : "Failed to load stories.",
    };
  }
}

const isBrowser = typeof window !== "undefined";

// Published stories are publicly readable (no auth in the RLS policy), so
// this doesn't need to wait for a session -- prefetchAllStories() is called
// at module load in app/_layout.tsx, running in parallel with the branded
// splash instead of only starting once Home/Search mount post-auth.
let inFlight: Promise<AllStoriesResult> | null = null;

export function prefetchAllStories(): Promise<AllStoriesResult> {
  // No-op during Node SSR (this module's prefetch call runs at import time,
  // which SSR also triggers) -- there's nothing to render server-side here,
  // and this sandbox specifically can't reach Supabase from Node at all.
  if (!isBrowser) {
    return Promise.resolve({ byCategory: {}, error: null });
  }
  if (!inFlight) inFlight = fetchAllStories();
  return inFlight;
}

export function useAllStories() {
  const [byCategory, setByCategory] = useState<Record<string, Story[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyResult = useCallback((result: AllStoriesResult) => {
    setByCategory(result.byCategory);
    setError(result.error);
    setLoading(false);
  }, []);

  // Explicit refresh (pull-to-refresh) always does a real fresh fetch --
  // reusing the prefetched/cached promise here would make "refresh" a no-op.
  const refresh = useCallback(async () => {
    setLoading(true);
    applyResult(await fetchAllStories());
  }, [applyResult]);

  useEffect(() => {
    prefetchAllStories().then(applyResult);
  }, [applyResult]);

  return { byCategory, loading, error, refresh };
}
