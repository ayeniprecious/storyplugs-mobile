import { useEffect, useState } from "react";

import type { Story, StoryCategory } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export const CATEGORY_ORDER: StoryCategory[] = [
  "kindness",
  "family",
  "faith",
  "forgiveness",
  "hope",
  "community",
  "children",
  "everyday_heroes",
];

export const CATEGORY_LABELS: Record<StoryCategory, string> = {
  kindness: "Kindness",
  family: "Family",
  faith: "Faith",
  forgiveness: "Forgiveness",
  hope: "Hope",
  community: "Community",
  children: "Children",
  everyday_heroes: "Everyday Heroes",
};

export function useAllStories() {
  const [byCategory, setByCategory] = useState<Record<string, Story[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("stories")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (cancelled) return;

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
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { byCategory, loading, error };
}
