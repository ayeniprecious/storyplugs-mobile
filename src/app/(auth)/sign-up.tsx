import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function SignUp() {
  const { signUpWithEmail } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSignUp() {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Fill in your name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: signUpError } = await signUpWithEmail(email.trim(), password, displayName.trim());
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
    } else {
      setConfirmationSent(true);
    }
  }

  if (confirmationSent) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title" style={styles.title}>
            Check your email
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            We sent a confirmation link to {email}. Confirm it, then come back and sign in.
          </ThemedText>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable style={styles.primaryButton}>
              <ThemedText style={styles.primaryButtonText}>Back to Sign In</ThemedText>
            </Pressable>
          </Link>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Create your account
        </ThemedText>

        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor="#8a8a8a"
          style={styles.input}
        />
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
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable style={styles.primaryButton} onPress={handleSignUp} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Sign Up</ThemedText>
          )}
        </Pressable>

        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <ThemedText type="link" style={styles.link}>
              Already have an account? Sign in
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  title: { textAlign: 'center', fontSize: 30, lineHeight: 36, marginBottom: Spacing.three },
  subtitle: { textAlign: 'center', marginBottom: Spacing.four },
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
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', marginTop: Spacing.four },
});
