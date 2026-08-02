import type { Session } from "@supabase/supabase-js";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BrandSplash } from "@/components/brand-splash";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { CategoriesProvider } from "@/context/categories-context";
import { ProfileProvider, useProfile } from "@/context/profile-context";
import {
  ThemePrefsProvider,
  useThemePrefs,
} from "@/context/theme-prefs-context";
import { prefetchDailyContent } from "@/hooks/use-daily-content";
import { prefetchAllStories } from "@/hooks/use-all-stories";
import type { Profile } from "@/lib/database.types";

SplashScreen.preventAutoHideAsync();

// Global fallback so any raw <Text> that skips ThemedText (and doesn't set
// its own fontFamily) still renders in Montserrat instead of the platform
// default -- ThemedText's own weight-aware resolution (lib/montserrat.ts)
// is the primary mechanism and still wins wherever a component uses it;
// this only fills the gap for the few spots that don't.
const TextDefaults = Text as unknown as { defaultProps?: { style?: unknown } };
TextDefaults.defaultProps = {
  ...TextDefaults.defaultProps,
  style: [{ fontFamily: "Montserrat_400Regular" }, TextDefaults.defaultProps?.style],
};

// Both queries are publicly readable (status='published' has no auth
// requirement in RLS), so there's no reason to wait for session/profile to
// resolve before starting them. Firing them here, at module load, means they
// run in parallel with the entire branded splash sequence below instead of
// only starting once Home mounts (which today requires auth AND profile AND
// routing to settle first) -- by the time Home actually mounts, this is
// usually already resolved and it renders real content instead of a
// skeleton. See the matching prefetch*/useDailyContent/useAllStories pairing
// in each hook for how the result gets reused instead of double-fetched.
prefetchDailyContent();
prefetchAllStories();

// How long the branded splash page stays up on cold start, minimum.
const BRAND_SPLASH_MIN_MS = 4000;

function AppStack({
  session,
  profile,
}: {
  session: Session | null;
  profile: Profile | null;
}) {
  // Personalization ships after some users already onboarded, so gate the two steps
  // separately — onboarding/index redirects to whichever one is still missing.
  const needsPersonalization =
    !profile || !profile.interests || profile.interests.length === 0;
  const needsNotificationPrefs =
    !profile || profile.notification_types.length === 0;
  const needsOnboarding =
    !!session && (needsPersonalization || needsNotificationPrefs);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && needsOnboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !needsOnboarding}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="story/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="notifications" options={{ presentation: "card" }} />
      </Stack.Protected>
      {/* Unguarded: OAuth code exchange and email confirmation links both land
          here regardless of whether a session already exists yet. */}
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}

function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [brandDelayDone, setBrandDelayDone] = useState(false);
  const [brandSplashHidden, setBrandSplashHidden] = useState(false);

  // Once there's a session, wait for the profile fetch to resolve before deciding whether
  // onboarding is needed — otherwise we'd briefly route to (app) then bounce to onboarding.
  const stillResolving = authLoading || (!!session && profileLoading);

  // Screens like /privacy and /about live outside the Stack.Protected groups
  // above (viewable pre-login by design), so they never redirect on their
  // own when a session ends -- Stack.Protected only reacts on navigation
  // into a group, not by evicting a screen you're already sitting on. Force
  // it here instead, on every truthy -> falsy session transition (manual
  // sign-out, self-deletion, or profile-context signing out an orphaned
  // session for an account deleted elsewhere): send everyone back to root,
  // which the guards above then correctly resolve to (auth)/welcome.
  const hadSessionRef = useRef(false);
  useEffect(() => {
    if (hadSessionRef.current && !session) {
      router.replace("/");
    }
    hadSessionRef.current = !!session;
  }, [session]);

  useEffect(() => {
    // Hand off from the native splash to the animated brand page right away,
    // and keep the brand page up for at least BRAND_SPLASH_MIN_MS.
    SplashScreen.hideAsync();
    const timer = setTimeout(
      () => setBrandDelayDone(true),
      BRAND_SPLASH_MIN_MS,
    );
    return () => clearTimeout(timer);
  }, []);

  if (!brandSplashHidden) {
    return (
      <View style={{ flex: 1 }}>
        {!stillResolving && <AppStack session={session} profile={profile} />}
        <BrandSplash
          done={brandDelayDone && !stillResolving}
          onHidden={() => setBrandSplashHidden(true)}
        />
      </View>
    );
  }

  // Profile refetches after the splash is gone (e.g. saving preferences) briefly pass
  // through here again — keep rendering nothing rather than re-showing the splash.
  if (stillResolving) {
    return null;
  }

  return <AppStack session={session} profile={profile} />;
}

function ThemedRoot() {
  const { resolvedScheme } = useThemePrefs();
  return (
    <ThemeProvider value={resolvedScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ProfileProvider>
          <RootNavigator />
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // Keep the native splash up until the brand font is ready — the Montserrat
  // wordmark on sign-in would otherwise flash in with the system font first.
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CategoriesProvider>
        <ThemePrefsProvider>
          <ThemedRoot />
        </ThemePrefsProvider>
      </CategoriesProvider>
    </GestureHandlerRootView>
  );
}
