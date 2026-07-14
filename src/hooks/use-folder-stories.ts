import { useCallback, useEffect, useState } from "react";

import type { Story } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export interface FolderStoryItem {
  storyId: string;
  story: Story;
}

// Detail view for a single folder screen: its stories (newest-added-first),
// plus add/remove. Ownership is enforced by story_folder_items' RLS (scoped
// through the parent folder's user_id), so this doesn't need the current
// user id at all -- a folderId the caller doesn't own simply returns nothing.
export function useFolderStories(folderId: string | undefined) {
  const [stories, setStories] = useState<FolderStoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!folderId) {
      setStories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("story_folder_items")
      .select("story_id, stories(*)")
      .eq("folder_id", folderId)
      .order("added_at", { ascending: false });

    setStories(
      ((data as unknown as { story_id: string; stories: Story | null }[]) ?? [])
        .filter((row) => row.stories)
        .map((row) => ({ storyId: row.story_id, story: row.stories as Story }))
    );
    setLoading(false);
  }, [folderId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addStory = useCallback(
    async (storyId: string) => {
      if (!folderId) return;
      await supabase.from("story_folder_items").insert({ folder_id: folderId, story_id: storyId });
      await refresh();
    },
    [folderId, refresh]
  );

  const removeStory = useCallback(
    async (storyId: string) => {
      if (!folderId) return;
      setStories((prev) => prev.filter((item) => item.storyId !== storyId));
      await supabase.from("story_folder_items").delete().eq("folder_id", folderId).eq("story_id", storyId);
    },
    [folderId]
  );

  return { stories, loading, refresh, addStory, removeStory };
}
