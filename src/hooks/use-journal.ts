import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import type { JournalEntry } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export function useJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .order("created_at", { ascending: false });
    setEntries((data as JournalEntry[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveEntry = useCallback(
    async (params: { storyId: string; storyTitle: string; reflectionQuestion: string; entry: string }) => {
      if (!user?.id) return { error: "Not signed in." };
      const trimmed = params.entry.trim();
      if (!trimmed) return { error: "Write something first." };
      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        story_id: params.storyId,
        story_title: params.storyTitle,
        reflection_question: params.reflectionQuestion,
        entry: trimmed,
      });
      if (!error) await refresh();
      return { error: error?.message ?? null };
    },
    [user?.id, refresh]
  );

  const updateEntry = useCallback(
    async (id: string, entry: string) => {
      const trimmed = entry.trim();
      if (!trimmed) return { error: "Write something first." };
      const { error } = await supabase.from("journal_entries").update({ entry: trimmed }).eq("id", id);
      if (!error) await refresh();
      return { error: error?.message ?? null };
    },
    [refresh]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (!error) await refresh();
      return { error: error?.message ?? null };
    },
    [refresh]
  );

  return { entries, loading, refresh, saveEntry, updateEntry, deleteEntry };
}
