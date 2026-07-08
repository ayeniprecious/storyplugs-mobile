import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function SignIn() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <LinearGradient colors={['#2a070b', '#000000']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {router.canGoBack() && (
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.6)" />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        )}
        <Text style={styles.title}>StoryPlugs</Text>
        <Text style={styles.subtitle}>Your daily emotional vitamin</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#8a8a8a"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <View style={styles.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#8a8a8a"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8a8a8a" />
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.primaryButton} onPress={handleSignIn} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
        </Pressable>

        <View style={styles.oauthGroup}>
          <Text style={styles.comingSoonLabel}>
            Continue with Google / Apple — coming soon (requires provider setup)
          </Text>
        </View>

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
  backLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  title: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Montserrat_700Bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: Spacing.four,
  },
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
  passwordWrap: { justifyContent: 'center', marginBottom: Spacing.two },
  passwordInput: { marginBottom: 0, paddingRight: Spacing.three + 28 },
  eyeButton: { position: 'absolute', right: Spacing.three, padding: 4 },
  error: { color: '#ff453a', marginBottom: Spacing.two, fontSize: 14 },
  primaryButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  oauthGroup: {
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  comingSoonLabel: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 14 },
  link: { color: '#3c87f7', textAlign: 'center', marginTop: Spacing.four, fontSize: 14 },
});
