import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useProfile } from "@/context/profile-context";
import type { StorySubmission } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

// The submitter's own submissions, any status -- so they can see pending/rejected too.
export function useMySubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<StorySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setSubmissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("story_submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSubmissions((data as StorySubmission[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { submissions, loading, refresh };
}

// The public "Community Stories" feed -- approved + visible, open to every reader
// regardless of premium status (only submitting is premium-gated).
export function useCommunityStories() {
  const [stories, setStories] = useState<StorySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("story_submissions")
      .select("*")
      .eq("status", "approved")
      .eq("is_visible", true)
      .order("created_at", { ascending: false });
    setStories((data as StorySubmission[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stories, loading, refresh };
}

export function useSubmitStory() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (title: string, body: string, category: string | null) => {
      if (!user?.id) return { error: "Not signed in." };
      setSubmitting(true);
      const authorName = profile?.display_name?.trim() || "A StoryPlugs reader";
      const { error } = await supabase.from("story_submissions").insert({
        user_id: user.id,
        author_name: authorName,
        title: title.trim(),
        body: body.trim(),
        category,
      });
      setSubmitting(false);
      return { error: error?.message ?? null };
    },
    [user?.id, profile?.display_name]
  );

  return { submit, submitting };
}
