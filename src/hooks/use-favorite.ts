import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

export function useFavorite(storyId: string) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("story_id", storyId)
        .maybeSingle();
      if (!cancelled) {
        setIsFavorited(!!data);
        setLoading(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [user?.id, storyId]);

  const toggle = useCallback(async () => {
    if (!user?.id) return;
    if (isFavorited) {
      setIsFavorited(false);
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("story_id", storyId);
    } else {
      setIsFavorited(true);
      await supabase.from("favorites").insert({ user_id: user.id, story_id: storyId });
    }
  }, [user?.id, storyId, isFavorited]);

  return { isFavorited, loading, toggle };
}
