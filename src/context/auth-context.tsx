import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
    extra: { dateOfBirth: string; gender: string }
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      extra: { dateOfBirth: string; gender: string }
    ) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: displayName } },
      });
      // With email confirmation enabled, signUp succeeds but returns no session
      // until the user clicks the confirmation link. With it disabled, a session
      // comes back immediately and onAuthStateChange routes straight into the app.
      const needsEmailConfirmation = !error && !data.session;

      // signUp() resolving doesn't guarantee the client has attached the new
      // session to outgoing request headers yet — without this, the update below
      // can silently match zero rows under RLS (PostgREST returns 204 either way).
      // setSession forces it to take effect before the update fires.
      if (!error && data.user && !needsEmailConfirmation && data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        await supabase
          .from("profiles")
          .update({ date_of_birth: extra.dateOfBirth, gender: extra.gender })
          .eq("id", data.user.id);
      }

      return { error: error?.message ?? null, needsEmailConfirmation };
    },
    []
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  // Standard Expo + Supabase OAuth recipe: get the provider's auth URL without
  // letting supabase-js redirect the whole page (skipBrowserRedirect), open it
  // in a browser tab we control, then hand the "code" it comes back with to
  // exchangeCodeForSession -- detectSessionInUrl is off (see lib/supabase.ts),
  // so nothing parses the callback URL automatically.
  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Linking.createURL("auth/callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      return { error: error?.message ?? "Could not start Google sign-in." };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) {
      return { error: result.type === "cancel" || result.type === "dismiss" ? null : "Google sign-in failed." };
    }

    const code = new URL(result.url).searchParams.get("code");
    if (!code) return { error: "Google sign-in did not return an authorization code." };

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return { error: exchangeError?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
    }),
    [session, loading, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
