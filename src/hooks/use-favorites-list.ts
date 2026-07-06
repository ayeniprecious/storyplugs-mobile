import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import type { Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export function useFavoritesList() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setStories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("favorites")
      .select("stories(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setStories(
      ((data as unknown as { stories: Story | null }[]) ?? [])
        .filter((row) => row.stories)
        .map((row) => row.stories as Story)
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stories, loading, refresh };
}
