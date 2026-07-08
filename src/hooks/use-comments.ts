import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useProfile } from "@/context/profile-context";
import type { Comment } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export interface CommentWithAuthor extends Comment {
  authorName: string;
  authorAvatarUrl: string | null;
}

export function useComments(storyId: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!storyId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: rows } = await supabase
      .from("comments")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: false });

    const list = (rows as Comment[]) ?? [];
    const userIds = [...new Set(list.map((c) => c.user_id))];
    const profileByid = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    if (userIds.length > 0) {
      // public_commenter_profiles is a view scoped to users who've posted a
      // public comment (see 20260717000000_public_commenter_profiles.sql) —
      // profiles itself only allows reading your own row.
      const { data: profiles } = await supabase
        .from("public_commenter_profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        profileByid.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
      }
    }

    setComments(
      list.map((c) => ({
        ...c,
        authorName: profileByid.get(c.user_id)?.display_name || "Anonymous",
        authorAvatarUrl: profileByid.get(c.user_id)?.avatar_url ?? null,
      }))
    );
    setLoading(false);
  }, [storyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addComment = useCallback(
    async (body: string) => {
      if (!user?.id) return { error: "Sign in to comment." };
      const trimmed = body.trim();
      if (!trimmed) return { error: "Write something first." };
      setPosting(true);
      setError(null);
      // Insert and get the real row back (id/created_at) instead of a full
      // refetch of every comment + author profile — the new comment appears
      // the instant the insert resolves, using the poster's own already-loaded
      // profile for the byline.
      const { data, error: insertError } = await supabase
        .from("comments")
        .insert({ story_id: storyId, user_id: user.id, body: trimmed })
        .select()
        .single();
      setPosting(false);
      if (insertError || !data) {
        const message = insertError?.message ?? "Couldn't post comment.";
        setError(message);
        return { error: message };
      }
      setComments((prev) => [
        {
          ...(data as Comment),
          authorName: profile?.display_name || "You",
          authorAvatarUrl: profile?.avatar_url ?? null,
        },
        ...prev,
      ]);
      return { error: null };
    },
    [storyId, user?.id, profile?.display_name, profile?.avatar_url]
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      await supabase.from("comments").delete().eq("id", commentId);
    },
    []
  );

  return { comments, loading, posting, error, addComment, removeComment };
}
