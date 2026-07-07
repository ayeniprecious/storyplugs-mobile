import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function SignIn() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          StoryPlugs
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Your daily emotional vitamin
        </ThemedText>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#8a8a8a"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#8a8a8a"
          secureTextEntry
          style={styles.input}
        />

        {error && (
          <ThemedText type="small" themeColor="text" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable style={styles.primaryButton} onPress={handleSignIn} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="default" style={styles.primaryButtonText}>
              Sign In
            </ThemedText>
          )}
        </Pressable>

        <ThemedView type="backgroundElement" style={styles.oauthGroup}>
          <ThemedText type="small" style={styles.comingSoonLabel}>
            Continue with Google / Apple — coming soon (requires provider setup)
          </ThemedText>
        </ThemedView>

        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <ThemedText type="link" style={styles.link}>
              Don&apos;t have an account? Sign up
            </ThemedText>
          </Pressable>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  title: { textAlign: 'center', fontSize: 28, lineHeight: 34 },
  subtitle: { textAlign: 'center', fontSize: 15, lineHeight: 21, marginBottom: Spacing.four },
  input: {
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
    color: '#fff',
    marginBottom: Spacing.two,
  },
  error: { color: '#ff453a', marginBottom: Spacing.two },
  primaryButton: {
    backgroundColor: '#e50914',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  oauthGroup: {
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderRadius: 10,
    alignItems: 'center',
  },
  comingSoonLabel: { textAlign: 'center', opacity: 0.7 },
  link: { textAlign: 'center', marginTop: Spacing.four },
});
