import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import type { NotificationContentType, Profile } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  saveNotificationPreferences: (
    types: NotificationContentType[],
    time: string
  ) => Promise<{ error: string | null }>;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error) setProfile(data as Profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user?.id, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const saveNotificationPreferences = useCallback(
    async (types: NotificationContentType[], time: string) => {
      if (!user?.id) return { error: "Not signed in." };
      const { error } = await supabase
        .from("profiles")
        .update({ notification_types: types, notification_time: time })
        .eq("id", user.id);
      if (!error) await fetchProfile(user.id);
      return { error: error?.message ?? null };
    },
    [user?.id, fetchProfile]
  );

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!user?.id) return { error: "Not signed in." };
      const trimmed = name.trim();
      if (!trimmed) return { error: "Name can't be empty." };
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: trimmed })
        .eq("id", user.id);
      if (!error) await fetchProfile(user.id);
      return { error: error?.message ?? null };
    },
    [user?.id, fetchProfile]
  );

  const value = useMemo(
    () => ({ profile, loading, refreshProfile, saveNotificationPreferences, updateDisplayName }),
    [profile, loading, refreshProfile, saveNotificationPreferences, updateDisplayName]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
