import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';

const STEP_COUNT = 5;
const MIN_AGE = 13;

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

function isRealDate(day: number, month: number, year: number) {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date <= new Date()
  );
}

function calculateAge(day: number, month: number, year: number) {
  const today = new Date();
  let age = today.getFullYear() - year;
  const hadBirthdayThisYear =
    today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day);
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

export default function SignUp() {
  const { signUpWithEmail } = useAuth();
  const { refreshProfile } = useProfile();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  function handleContinue() {
    setError(null);

    if (step === 0) {
      if (!displayName.trim()) {
        setError('Enter your name.');
        return;
      }
    } else if (step === 1) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Enter a valid email.');
        return;
      }
    } else if (step === 2) {
      const d = Number(day);
      const m = Number(month);
      const y = Number(year);
      if (!d || !m || !y || !isRealDate(d, m, y)) {
        setError('Enter a valid date of birth.');
        return;
      }
      if (calculateAge(d, m, y) < MIN_AGE) {
        setError(`You must be at least ${MIN_AGE} years old to sign up.`);
        return;
      }
    } else if (step === 3) {
      if (!gender) {
        setError('Select an option to continue.');
        return;
      }
    }

    if (step < STEP_COUNT - 1) {
      setStep(step + 1);
      return;
    }
    handleSignUp();
  }

  async function handleSignUp() {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const dateOfBirth = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const { error: signUpError, needsEmailConfirmation } = await signUpWithEmail(
      email.trim(),
      password,
      displayName.trim(),
      { dateOfBirth, gender }
    );
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
    } else if (needsEmailConfirmation) {
      setConfirmationSent(true);
    } else {
      // A session came back already — refresh so date_of_birth/gender are in the
      // cached profile before the root layout's auth guard routes into onboarding.
      await refreshProfile();
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
        <ThemedView style={styles.header}>
          {step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={12} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color="#8a8a8e" />
              <ThemedText type="small" style={styles.backLabel}>
                Back
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedView style={styles.backButton} />
          )}
          <ThemedView style={styles.progressDots}>
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <ThemedView
                key={i}
                style={[styles.dot, i === step ? styles.dotActive : i < step && styles.dotDone]}
              />
            ))}
          </ThemedView>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 0 && (
            <>
              <ThemedText type="title" style={styles.title}>
                What&apos;s your name?
              </ThemedText>
              <ThemedText style={styles.subtitle}>So we know what to call you.</ThemedText>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#8a8a8a"
                autoFocus
                style={styles.input}
              />
            </>
          )}

          {step === 1 && (
            <>
              <ThemedText type="title" style={styles.title}>
                What&apos;s your email?
              </ThemedText>
              <ThemedText style={styles.subtitle}>We&apos;ll use this to sign you in.</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#8a8a8a"
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
                style={styles.input}
              />
            </>
          )}

          {step === 2 && (
            <>
              <ThemedText type="title" style={styles.title}>
                When&apos;s your birthday?
              </ThemedText>
              <ThemedText style={styles.subtitle}>Helps us tailor content that fits.</ThemedText>
              <ThemedView style={styles.dobRow}>
                <TextInput
                  value={day}
                  onChangeText={setDay}
                  placeholder="DD"
                  placeholderTextColor="#8a8a8a"
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.input, styles.dobInput]}
                />
                <TextInput
                  value={month}
                  onChangeText={setMonth}
                  placeholder="MM"
                  placeholderTextColor="#8a8a8a"
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.input, styles.dobInput]}
                />
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  placeholder="YYYY"
                  placeholderTextColor="#8a8a8a"
                  keyboardType="number-pad"
                  maxLength={4}
                  style={[styles.input, styles.dobInputYear]}
                />
              </ThemedView>
            </>
          )}

          {step === 3 && (
            <>
              <ThemedText type="title" style={styles.title}>
                What&apos;s your gender?
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Helps us personalize your experience.
              </ThemedText>
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setGender(option.value)}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                  >
                    <ThemedText type="smallBold">{option.label}</ThemedText>
                    <ThemedView style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <ThemedView style={styles.radioInner} />}
                    </ThemedView>
                  </Pressable>
                );
              })}
            </>
          )}

          {step === 4 && (
            <>
              <ThemedText type="title" style={styles.title}>
                Create a password
              </ThemedText>
              <ThemedText style={styles.subtitle}>At least 6 characters.</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#8a8a8a"
                secureTextEntry
                autoFocus
                style={styles.input}
              />
            </>
          )}

          {error && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Pressable style={styles.primaryButton} onPress={handleContinue} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                {step < STEP_COUNT - 1 ? 'Continue' : 'Create Account'}
              </ThemedText>
            )}
          </Pressable>

          {step === 0 && (
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <ThemedText type="link" style={styles.link}>
                  Already have an account? Sign in
                </ThemedText>
              </Pressable>
            </Link>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backLabel: { opacity: 0.6 },
  progressDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    marginRight: 70,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3a3a3c' },
  dotActive: { backgroundColor: '#C01918', width: 22 },
  dotDone: { backgroundColor: '#C01918', opacity: 0.5 },
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: { fontSize: 24, lineHeight: 30, marginBottom: Spacing.two },
  subtitle: { opacity: 0.75, marginBottom: Spacing.three },
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
  dobRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: 'transparent' },
  dobInput: { flex: 1, minWidth: 0, paddingHorizontal: Spacing.two, textAlign: 'center' },
  dobInputYear: { flex: 1.4, minWidth: 0, paddingHorizontal: Spacing.two, textAlign: 'center' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    marginBottom: Spacing.two,
  },
  optionCardSelected: { borderColor: '#C01918' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3a3a3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#C01918' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C01918' },
  error: { color: '#ff453a', marginBottom: Spacing.two },
  primaryButton: {
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  link: { textAlign: 'center', marginTop: Spacing.four },
});
