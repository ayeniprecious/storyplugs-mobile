import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useProfile } from "@/context/profile-context";
import type { Comment } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export interface CommentWithAuthor extends Comment {
  authorName: string;
  authorAvatarUrl: string | null;
  authorStreak: number;
}

export interface ThreadedComment extends CommentWithAuthor {
  replies: CommentWithAuthor[];
}

export function useComments(storyId: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [comments, setComments] = useState<ThreadedComment[]>([]);
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
    const profileById = new Map<
      string,
      { display_name: string | null; avatar_url: string | null; current_streak: number }
    >();
    if (userIds.length > 0) {
      // public_commenter_profiles is a view scoped to users who've posted a
      // public comment (see 20260717000000_public_commenter_profiles.sql) —
      // profiles itself only allows reading your own row. current_streak
      // comes from the 20260718000000 migration.
      const { data: profiles } = await supabase
        .from("public_commenter_profiles")
        .select("id, display_name, avatar_url, current_streak")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        profileById.set(p.id, {
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          current_streak: p.current_streak,
        });
      }
    }

    const withAuthor: CommentWithAuthor[] = list.map((c) => ({
      ...c,
      authorName: profileById.get(c.user_id)?.display_name || "Anonymous",
      authorAvatarUrl: profileById.get(c.user_id)?.avatar_url ?? null,
      authorStreak: profileById.get(c.user_id)?.current_streak ?? 0,
    }));

    const repliesByParent = new Map<string, CommentWithAuthor[]>();
    const topLevel: CommentWithAuthor[] = [];
    for (const c of withAuthor) {
      if (c.parent_id) {
        const arr = repliesByParent.get(c.parent_id) ?? [];
        arr.push(c);
        repliesByParent.set(c.parent_id, arr);
      } else {
        topLevel.push(c);
      }
    }

    setComments(
      topLevel.map((c) => ({
        ...c,
        replies: (repliesByParent.get(c.id) ?? []).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      }))
    );
    setLoading(false);
  }, [storyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addComment = useCallback(
    async (body: string, parentId?: string) => {
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
        .insert({ story_id: storyId, user_id: user.id, body: trimmed, parent_id: parentId ?? null })
        .select()
        .single();
      setPosting(false);
      if (insertError || !data) {
        const message = insertError?.message ?? "Couldn't post comment.";
        setError(message);
        return { error: message };
      }
      const newComment: CommentWithAuthor = {
        ...(data as Comment),
        authorName: profile?.display_name || "You",
        authorAvatarUrl: profile?.avatar_url ?? null,
        authorStreak: 0,
      };
      if (parentId) {
        setComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: [...c.replies, newComment] } : c))
        );
      } else {
        setComments((prev) => [{ ...newComment, replies: [] }, ...prev]);
      }
      return { error: null };
    },
    [storyId, user?.id, profile?.display_name, profile?.avatar_url]
  );

  const removeComment = useCallback(async (commentId: string) => {
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== commentId) }))
    );
    await supabase.from("comments").delete().eq("id", commentId);
  }, []);

  return { comments, loading, posting, error, addComment, removeComment };
}
