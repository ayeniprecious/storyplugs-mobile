import { useCallback, useState } from "react";

import { useAuth } from "@/context/auth-context";
import type { ReportTargetType } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export function useReports() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const submitReport = useCallback(
    async (targetType: ReportTargetType, targetId: string, reason: string) => {
      if (!user?.id) return { error: "Sign in to report." };
      const trimmed = reason.trim();
      if (!trimmed) return { error: "Choose a reason." };
      setSubmitting(true);
      const { error } = await supabase.from("reports").insert({
        reporter_user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason: trimmed,
      });
      setSubmitting(false);
      return { error: error?.message ?? null };
    },
    [user?.id]
  );

  return { submitting, submitReport };
}
