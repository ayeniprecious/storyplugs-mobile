import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { canChangeDisplayName, getNextNameChangeDate } from "@/lib/display-name-lock";
import type { NotificationContentType, Profile, StoryLengthPref } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: (options?: { silent?: boolean }) => Promise<void>;
  saveNotificationPreferences: (
    types: NotificationContentType[],
    time: string | null
  ) => Promise<{ error: string | null }>;
  savePersonalization: (
    interests: string[],
    goals: string[],
    storyLength: StoryLengthPref
  ) => Promise<{ error: string | null }>;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  setHideIdentityInComments: (hide: boolean) => Promise<{ error: string | null }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // `silent` skips the loading flag -- RootNavigator treats `loading` as "still
  // resolving" and renders nothing while it's true, which unmounts the whole
  // Stack navigator. That's correct for the *initial* profile fetch (before we
  // know whether onboarding is needed), but every settings save also calls this
  // to refresh local state, and doing that non-silently was bouncing users back
  // to Home mid-navigation on every save.
  const fetchProfile = useCallback(async (userId: string, options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error) setProfile(data as Profile);
    if (!options?.silent) setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user?.id, fetchProfile]);

  const refreshProfile = useCallback(
    async (options?: { silent?: boolean }) => {
      if (user?.id) await fetchProfile(user.id, options);
    },
    [user?.id, fetchProfile]
  );

  const saveNotificationPreferences = useCallback(
    async (types: NotificationContentType[], time: string | null) => {
      if (!user?.id) return { error: "Not signed in." };
      const { error } = await supabase
        .from("profiles")
        .update({ notification_types: types, notification_time: time })
        .eq("id", user.id);
      if (!error) await fetchProfile(user.id, { silent: true });
      return { error: error?.message ?? null };
    },
    [user?.id, fetchProfile]
  );

  const savePersonalization = useCallback(
    async (interests: string[], goals: string[], storyLength: StoryLengthPref) => {
      if (!user?.id) return { error: "Not signed in." };
      const { error } = await supabase
        .from("profiles")
        .update({ interests, personal_goals: goals, story_length_pref: storyLength })
        .eq("id", user.id);
      if (!error) await fetchProfile(user.id, { silent: true });
      return { error: error?.message ?? null };
    },
    [user?.id, fetchProfile]
  );

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!user?.id) return { error: "Not signed in." };
      const trimmed = name.trim();
      if (!trimmed) return { error: "Name can't be empty." };
      if (!canChangeDisplayName(profile?.display_name_changed_at ?? null)) {
        const next = getNextNameChangeDate(profile?.display_name_changed_at ?? null);
        const nextLabel = next?.toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        return { error: `You can change your name again on ${nextLabel}.` };
      }
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: trimmed, display_name_changed_at: new Date().toISOString() })
        .eq("id", user.id);
      if (!error) await fetchProfile(user.id, { silent: true });
      return { error: error?.message ?? null };
    },
    [user?.id, profile?.display_name_changed_at, fetchProfile]
  );

  const setHideIdentityInComments = useCallback(
    async (hide: boolean) => {
      if (!user?.id) return { error: "Not signed in." };
      const { error } = await supabase
        .from("profiles")
        .update({ hide_identity_in_comments: hide })
        .eq("id", user.id);
      if (!error) await fetchProfile(user.id, { silent: true });
      return { error: error?.message ?? null };
    },
    [user?.id, fetchProfile]
  );

  const value = useMemo(
    () => ({
      profile,
      loading,
      refreshProfile,
      saveNotificationPreferences,
      savePersonalization,
      updateDisplayName,
      setHideIdentityInComments,
    }),
    [
      profile,
      loading,
      refreshProfile,
      saveNotificationPreferences,
      savePersonalization,
      updateDisplayName,
      setHideIdentityInComments,
    ]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
