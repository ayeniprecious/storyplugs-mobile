import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

// Which of the user's folders a single story currently sits in -- the
// inverse of useFolderStories (which lists stories for one folder). Used by
// AddToFolderModal's "which folders is this story already in" checklist.
export function useStoryFolderMembership(storyId: string) {
  const [folderIds, setFolderIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!storyId) {
      setFolderIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("story_folder_items").select("folder_id").eq("story_id", storyId);
    setFolderIds(new Set(((data as { folder_id: string }[]) ?? []).map((row) => row.folder_id)));
    setLoading(false);
  }, [storyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFolder = useCallback(
    async (folderId: string) => {
      const alreadyIn = folderIds.has(folderId);
      setFolderIds((prev) => {
        const next = new Set(prev);
        if (alreadyIn) next.delete(folderId);
        else next.add(folderId);
        return next;
      });
      if (alreadyIn) {
        await supabase.from("story_folder_items").delete().eq("folder_id", folderId).eq("story_id", storyId);
      } else {
        await supabase.from("story_folder_items").insert({ folder_id: folderId, story_id: storyId });
      }
    },
    [storyId, folderIds]
  );

  return { folderIds, loading, toggleFolder, refresh };
}
