import { useCallback, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

export function useFeedback() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = useCallback(
    async (message: string) => {
      if (!user?.id) return { error: "Sign in to send feedback." };
      const trimmed = message.trim();
      if (!trimmed) return { error: "Write a message first." };
      setSubmitting(true);
      setError(null);
      const { error: insertError } = await supabase
        .from("feedback")
        .insert({ user_id: user.id, message: trimmed });
      setSubmitting(false);
      if (insertError) {
        setError(insertError.message);
        return { error: insertError.message };
      }
      return { error: null };
    },
    [user?.id]
  );

  return { submitting, error, submitFeedback };
}
