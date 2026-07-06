import { useEffect, useState } from "react";

import type { StoryChapter } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export function useStoryChapters(storyId: string) {
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!storyId) {
        setChapters([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("story_chapters")
        .select("*")
        .eq("story_id", storyId)
        .order("chapter_number", { ascending: true });

      if (!cancelled) {
        setChapters((data as StoryChapter[]) ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  return { chapters, loading };
}
