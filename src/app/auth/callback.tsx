import type { EmailOtpType } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

// Query params and hash-fragment params both matter here -- Supabase puts
// OAuth codes and token_hash/type in the query string, but an implicit-style
// email link redirect puts access_token/refresh_token after a "#". Merging
// both into one bag means the handler below doesn't need to care which shape
// showed up.
function extractParams(fullUrl: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const url = new URL(fullUrl);
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    if (url.hash.length > 1) {
      new URLSearchParams(url.hash.slice(1)).forEach((value, key) => {
        params[key] = value;
      });
    }
  } catch {
    // malformed URL -- params stays empty, caller reports "invalid link"
  }
  return params;
}

// Single landing spot for every link that isn't opened directly inside the
// app: Google/Apple sign-in (exchanges an OAuth code) and email confirmation
// links (verifies a token_hash, or sets a session directly if Supabase
// redirected with tokens already attached). detectSessionInUrl is off (see
// lib/supabase.ts) so nothing parses these automatically -- this is the one
// place that does, for every flow, on every platform.
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    async function handleUrl(fullUrl: string) {
      if (handledRef.current) return;
      handledRef.current = true;

      const params = extractParams(fullUrl);

      if (params.error) {
        setError(params.error_description?.replace(/\+/g, ' ') || params.error);
        return;
      }

      if (params.access_token && params.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (sessionError) setError(sessionError.message);
        else router.replace('/');
        return;
      }

      if (params.token_hash && params.type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: params.token_hash,
          type: params.type as EmailOtpType,
        });
        if (verifyError) setError(verifyError.message);
        else router.replace('/');
        return;
      }

      if (params.code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
        if (exchangeError) setError(exchangeError.message);
        else router.replace('/');
        return;
      }

      setError('This link is invalid or has expired.');
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    // Covers the app already being open in the background when the link is
    // tapped -- getInitialURL only fires for a cold launch.
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {error ? (
          <>
            <Text style={styles.title}>Link problem</Text>
            <Text style={styles.subtitle}>{error}</Text>
            <Pressable style={styles.button} onPress={() => router.replace('/(auth)/sign-in')}>
              <Text style={styles.buttonText}>Back to Sign In</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color="#C01918" size="large" />
            <Text style={styles.subtitle}>Confirming…</Text>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  title: { color: '#fff', fontSize: 20, fontWeight: '600' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center' },
  button: { backgroundColor: '#C01918', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
