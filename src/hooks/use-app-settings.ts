import { useEffect, useState } from "react";

import type { AppSetting } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

// app_settings is admin-editable (app name/logo/privacy policy/terms), publicly
// readable -- see 20260713000000_admin_features.sql. Returns a key -> value map.
export function useAppSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.from("app_settings").select("key, value");
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const row of (data as AppSetting[]) ?? []) {
        if (row.value != null) map[row.key] = row.value;
      }
      setSettings(map);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
