import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import type { AppSetting } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

// app_settings is admin-editable (app name/logo/privacy policy/terms), publicly
// readable -- see 20260713000000_admin_features.sql. Returns a key -> value map.
export function useAppSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("key, value");
    const map: Record<string, string> = {};
    for (const row of (data as AppSetting[]) ?? []) {
      if (row.value != null) map[row.key] = row.value;
    }
    setSettings(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    // Every screen that shows the app name/logo holds its own instance of this hook (TopNav,
    // sign-in, About, ...), so each needs a uniquely-named channel -- reusing one across
    // simultaneous subscribers throws on the second `.subscribe()`. Without this, an admin
    // changing the app name only reaches devices that fully relaunch the app afterward.
    const channel = supabase
      .channel(`app_settings:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    // Realtime requires app_settings to be in the project's publication (a dashboard/
    // migration toggle outside app code), so this is a guaranteed fallback: whenever the
    // app comes back to the foreground it refetches regardless of that configuration.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return { settings, loading };
}
