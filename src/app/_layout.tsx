import type { Session } from "@supabase/supabase-js";
import {
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { BrandSplash } from "@/components/brand-splash";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { CategoriesProvider } from "@/context/categories-context";
import { ProfileProvider, useProfile } from "@/context/profile-context";
import {
  ThemePrefsProvider,
  useThemePrefs,
} from "@/context/theme-prefs-context";
import type { Profile } from "@/lib/database.types";

SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded] = useFonts({ Montserrat_600SemiBold, Montserrat_700Bold });
  if (!fontsLoaded) return null;

  return (
    <CategoriesProvider>
      <ThemePrefsProvider>
        <ThemedRoot />
      </ThemePrefsProvider>
    </CategoriesProvider>
  );
}
