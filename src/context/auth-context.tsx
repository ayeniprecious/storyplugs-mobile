import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

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
  signInWithApple: () => Promise<{ error: string | null }>;
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
        options: {
          data: { full_name: displayName },
          emailRedirectTo: Linking.createURL("auth/callback"),
        },
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

  // Shared by Google and Apple -- the two providers only differ by name.
  //
  // Native: get the provider's auth URL without letting supabase-js redirect
  // the whole app (skipBrowserRedirect), open it in a browser tab we control,
  // then hand the "code" it comes back with to exchangeCodeForSession --
  // detectSessionInUrl is off (see lib/supabase.ts), so nothing parses the
  // callback URL automatically. WebBrowser.openAuthSessionAsync resolves once
  // the OS hands the storyplugsmobile:// redirect back to the app.
  //
  // Web: there's no popup to babysit and nothing to hand back here.
  // skipBrowserRedirect defaults to false, so signInWithOAuth navigates the
  // whole tab to the provider's consent screen itself; the provider then
  // redirects to redirectTo, which is our own /auth/callback route -- the app
  // reloads there and that screen finishes the sign-in. (A popup-based flow
  // would need the popup to report back across origins, which the provider's
  // consent screen won't let it do until it's already redirected back to our
  // own origin -- simplest to just let the whole page navigate instead.)
  const signInWithOAuthProvider = useCallback(async (provider: "google" | "apple") => {
    const redirectTo = Linking.createURL("auth/callback");

    if (Platform.OS === "web") {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      return { error: error?.message ?? null };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      return { error: error?.message ?? `Could not start ${provider} sign-in.` };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) {
      return { error: result.type === "cancel" || result.type === "dismiss" ? null : `${provider} sign-in failed.` };
    }

    const code = new URL(result.url).searchParams.get("code");
    if (!code) return { error: `${provider} sign-in did not return an authorization code.` };

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return { error: exchangeError?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(() => signInWithOAuthProvider("google"), [signInWithOAuthProvider]);
  const signInWithApple = useCallback(() => signInWithOAuthProvider("apple"), [signInWithOAuthProvider]);

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
      signInWithApple,
      signOut,
    }),
    [session, loading, signUpWithEmail, signInWithEmail, signInWithGoogle, signInWithApple, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
