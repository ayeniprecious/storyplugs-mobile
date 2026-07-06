import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { ProfileProvider, useProfile } from '@/context/profile-context';
import { ThemePrefsProvider, useThemePrefs } from '@/context/theme-prefs-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Once there's a session, wait for the profile fetch to resolve before deciding whether
  // onboarding is needed — otherwise we'd briefly route to (app) then bounce to onboarding.
  const stillResolving = authLoading || (!!session && profileLoading);

  useEffect(() => {
    if (!stillResolving) {
      SplashScreen.hideAsync();
    }
  }, [stillResolving]);

  if (stillResolving) {
    return null;
  }

  const needsOnboarding = !!session && (!profile || profile.notification_types.length === 0);

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
        <Stack.Screen name="story/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
      </Stack.Protected>
    </Stack>
  );
}

function ThemedRoot() {
  const { resolvedScheme } = useThemePrefs();
  return (
    <ThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ProfileProvider>
          <RootNavigator />
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePrefsProvider>
      <ThemedRoot />
    </ThemePrefsProvider>
  );
}
