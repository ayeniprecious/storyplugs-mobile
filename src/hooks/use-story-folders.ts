import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import type { Story, StoryFolder } from "@/lib/database.types";
import { estimateReadMinutes } from "@/lib/read-time";
import { supabase } from "@/lib/supabase";

export interface FolderSummary {
  id: string;
  name: string;
  itemCount: number;
  // Up to 3 most-recently-added stories, newest first -- drives the folder
  // tile's stacked cover peek.
  coverStories: Story[];
  // Sum of estimateReadMinutes across every story in the folder, not just
  // the 3 covers -- the item-rows query already fetches every story's full
  // body for this folder, so this comes free without an extra fetch.
  totalReadMinutes: number;
}

interface FolderItemRow {
  folder_id: string;
  stories: Story | null;
}

// List view for Library's "My Folders" row: every folder the user owns, each
// with an item count and up to 3 cover thumbnails. Supabase's client can't
// express "top 3 per group" server-side, so this fetches every item row for
// the user's folders (ordered newest-added-first) and groups client-side --
// same approach use-notifications.ts uses for notification_stories.
export function useStoryFolders() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setFolders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: folderRows } = await supabase
      .from("story_folders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const list = (folderRows as StoryFolder[]) ?? [];
    if (list.length === 0) {
      setFolders([]);
      setLoading(false);
      return;
    }

    const { data: itemRows } = await supabase
      .from("story_folder_items")
      .select("folder_id, stories(*)")
      .in(
        "folder_id",
        list.map((f) => f.id)
      )
      .order("added_at", { ascending: false });

    const byFolder = new Map<string, Story[]>();
    for (const row of (itemRows as unknown as FolderItemRow[]) ?? []) {
      if (!row.stories) continue;
      const existing = byFolder.get(row.folder_id) ?? [];
      existing.push(row.stories);
      byFolder.set(row.folder_id, existing);
    }

    setFolders(
      list.map((folder) => {
        const stories = byFolder.get(folder.id) ?? [];
        return {
          id: folder.id,
          name: folder.name,
          itemCount: stories.length,
          coverStories: stories.slice(0, 3),
          totalReadMinutes: stories.reduce((sum, story) => sum + estimateReadMinutes(story.body), 0),
        };
      })
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFolder = useCallback(
    async (name: string) => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("story_folders")
        .insert({ user_id: user.id, name })
        .select()
        .single();
      if (error) return null;
      await refresh();
      return data as StoryFolder;
    },
    [user?.id, refresh]
  );

  const deleteFolder = useCallback(async (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    await supabase.from("story_folders").delete().eq("id", folderId);
  }, []);

  return { folders, loading, refresh, createFolder, deleteFolder };
}
