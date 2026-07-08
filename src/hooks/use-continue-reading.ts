import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import type { Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface ContinueReadingItem {
  story: Story;
  progressPercent: number;
}

export function useContinueReading() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContinueReadingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("story_views")
      .select("progress_percent, stories(*)")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("updated_at", { ascending: false })
      .limit(12);

    setItems(
      ((data as unknown as { progress_percent: number; stories: Story | null }[]) ?? [])
        .filter((row) => row.stories)
        .map((row) => ({ story: row.stories as Story, progressPercent: row.progress_percent }))
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeItem = useCallback(
    async (storyId: string) => {
      if (!user?.id) return;
      setItems((prev) => prev.filter((item) => item.story.id !== storyId));
      await supabase.from("story_views").delete().eq("user_id", user.id).eq("story_id", storyId);
    },
    [user?.id]
  );

  return { items, loading, refresh, removeItem };
}
