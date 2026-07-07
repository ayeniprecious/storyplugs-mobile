import { useCallback, useEffect, useState } from "react";

import type { Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export function useAllStories() {
  const [byCategory, setByCategory] = useState<Record<string, Story[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("stories")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const grouped: Record<string, Story[]> = {};
    for (const story of (data as Story[]) ?? []) {
      (grouped[story.category] ??= []).push(story);
    }
    setByCategory(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { byCategory, loading, error, refresh };
}
