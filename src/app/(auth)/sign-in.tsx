import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGradient, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemePrefs } from '@/context/theme-prefs-context';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useTheme } from '@/hooks/use-theme';

// Closes the in-progress auth browser tab/popup when it redirects back with
// the OAuth result -- see the Expo + Supabase OAuth guide.
WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const { signInWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const { settings } = useAppSettings();
  const theme = useTheme();
  const { resolvedScheme } = useThemePrefs();
  const appName = settings.app_name || 'StoryPlugs';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [appleSubmitting, setAppleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signInWithEmail(email.trim(), password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  }

  async function handleGoogleSignIn() {
    setGoogleSubmitting(true);
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    setGoogleSubmitting(false);
    if (googleError) setError(googleError);
  }

  async function handleAppleSignIn() {
    setAppleSubmitting(true);
    setError(null);
    const { error: appleError } = await signInWithApple();
    setAppleSubmitting(false);
    if (appleError) setError(appleError);
  }

  return (
    <LinearGradient colors={AuthGradient[resolvedScheme]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {router.canGoBack() && (
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
            <Text style={[styles.backLabel, { color: theme.textSecondary }]}>Back</Text>
          </Pressable>
        )}
        <Text style={[styles.title, { color: theme.text }]}>{appName}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your daily emotional vitamin</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        <View style={styles.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.placeholder}
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput, { borderColor: theme.border, color: theme.text }]}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.placeholder} />
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.primaryButton} onPress={handleSignIn} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <Pressable
          style={[styles.googleButton, { borderColor: theme.border }]}
          onPress={handleGoogleSignIn}
          disabled={googleSubmitting}
        >
          {googleSubmitting ? (
            <ActivityIndicator color="#1f1f1f" />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#1f1f1f" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.appleButton, { borderColor: theme.border }]}
          onPress={handleAppleSignIn}
          disabled={appleSubmitting}
        >
          {appleSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </>
          )}
        </Pressable>

        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <Text style={styles.link}>Don&apos;t have an account? Sign up</Text>
          </Pressable>
        </Link>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two + 4,
    gap: Spacing.two,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.two + 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLabel: { fontSize: 14 },
  title: {
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Montserrat_700Bold',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: Spacing.four,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  passwordWrap: { justifyContent: 'center', marginBottom: Spacing.two },
  passwordInput: { marginBottom: 0, paddingRight: Spacing.three + 28 },
  eyeButton: { position: 'absolute', right: Spacing.three, padding: 4 },
  error: { color: '#ff453a', marginBottom: Spacing.two, fontSize: 14 },
  primaryButton: {
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.two,
    marginTop: Spacing.three,
  },
  googleButtonText: { color: '#1f1f1f', fontWeight: '600', fontSize: 15 },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#000',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  appleButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  link: { color: '#3c87f7', textAlign: 'center', marginTop: Spacing.four, fontSize: 14 },
});
