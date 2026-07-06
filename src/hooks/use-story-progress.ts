import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

interface ProgressState {
  completed: boolean;
  progressPercent: number;
  listenedAudio: boolean;
}

export function useStoryProgress(storyId: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [loading, setLoading] = useState(true);
  const percentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!user?.id || !storyId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("story_views")
        .select("completed, progress_percent, listened_audio")
        .eq("user_id", user.id)
        .eq("story_id", storyId)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setProgress({
          completed: data.completed,
          progressPercent: data.progress_percent,
          listenedAudio: data.listened_audio,
        });
      } else {
        await supabase
          .from("story_views")
          .insert({ user_id: user.id, story_id: storyId, completed: false, progress_percent: 0 });
        if (!cancelled) setProgress({ completed: false, progressPercent: 0, listenedAudio: false });
      }
      if (!cancelled) setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [user?.id, storyId]);

  const updateProgressPercent = useCallback(
    (percent: number) => {
      if (!user?.id || !storyId) return;
      setProgress((prev) => (prev && !prev.completed ? { ...prev, progressPercent: percent } : prev));
      if (percentTimer.current) clearTimeout(percentTimer.current);
      percentTimer.current = setTimeout(() => {
        supabase
          .from("story_views")
          .update({ progress_percent: percent })
          .eq("user_id", user.id)
          .eq("story_id", storyId)
          .eq("completed", false);
      }, 800);
    },
    [user?.id, storyId]
  );

  const markComplete = useCallback(async () => {
    if (!user?.id || !storyId) return;
    setProgress((prev) => ({ ...(prev ?? { listenedAudio: false }), completed: true, progressPercent: 100 }));
    await supabase
      .from("story_views")
      .update({ completed: true, progress_percent: 100 })
      .eq("user_id", user.id)
      .eq("story_id", storyId);
  }, [user?.id, storyId]);

  const markListened = useCallback(async () => {
    if (!user?.id || !storyId) return;
    setProgress((prev) => (prev ? { ...prev, listenedAudio: true } : prev));
    await supabase
      .from("story_views")
      .update({ listened_audio: true })
      .eq("user_id", user.id)
      .eq("story_id", storyId);
  }, [user?.id, storyId]);

  const removeFromContinueReading = useCallback(async () => {
    if (!user?.id || !storyId) return;
    setProgress(null);
    await supabase.from("story_views").delete().eq("user_id", user.id).eq("story_id", storyId);
  }, [user?.id, storyId]);

  return {
    progress,
    loading,
    updateProgressPercent,
    markComplete,
    markListened,
    removeFromContinueReading,
  };
}
