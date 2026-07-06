import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useRecordActivity() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      await supabase
        .from("reading_activity")
        .upsert(
          { user_id: user.id, activity_date: todayDateString() },
          { onConflict: "user_id,activity_date", ignoreDuplicates: true }
        );
    })();
  }, [user?.id]);
}
