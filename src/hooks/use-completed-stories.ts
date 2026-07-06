import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import type { Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface CompletedStoryItem {
  story: Story;
  completedAt: string;
}

export function useCompletedStories() {
  const { user } = useAuth();
  const [items, setItems] = useState<CompletedStoryItem[]>([]);
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
      .select("updated_at, stories(*)")
      .eq("user_id", user.id)
      .eq("completed", true)
      .order("updated_at", { ascending: false });

    setItems(
      ((data as unknown as { updated_at: string; stories: Story | null }[]) ?? [])
        .filter((row) => row.stories)
        .map((row) => ({ story: row.stories as Story, completedAt: row.updated_at }))
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh };
}
