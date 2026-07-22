import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [showPassword, setShowPassword] = useState(false);
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
      <LinearGradient colors={['#2a070b', '#000000']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to {email}. Confirm it, then come back and sign in.
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Back to Sign In</Text>
            </Pressable>
          </Link>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#2a070b', '#000000']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={12} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.6)" />
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}
          <View style={styles.progressDots}>
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step ? styles.dotActive : i < step && styles.dotDone]} />
            ))}
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {step === 0 && (
            <>
              <Text style={styles.title}>What&apos;s your name?</Text>
              <Text style={styles.subtitle}>So we know what to call you.</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#8a8a8a"
                style={styles.input}
              />
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.title}>What&apos;s your email?</Text>
              <Text style={styles.subtitle}>We&apos;ll use this to sign you in.</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#8a8a8a"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>When&apos;s your birthday?</Text>
              <Text style={styles.subtitle}>Helps us tailor content that fits.</Text>
              <View style={styles.dobRow}>
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
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>What&apos;s your gender?</Text>
              <Text style={styles.subtitle}>Helps us personalize your experience.</Text>
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setGender(option.value)}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                  >
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.title}>Create a password</Text>
              <Text style={styles.subtitle}>At least 6 characters.</Text>
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
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.primaryButton} onPress={handleContinue} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {step < STEP_COUNT - 1 ? 'Continue' : 'Create Account'}
              </Text>
            )}
          </Pressable>

          {step === 0 && (
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text style={styles.link}>Already have an account? Sign in</Text>
              </Pressable>
            </Link>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
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
  backLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    flexGrow: 1,
    justifyContent: 'center',
  },
  footer: { paddingHorizontal: Spacing.two + 4, paddingBottom: Spacing.three, gap: Spacing.two },
  title: { color: '#fff', fontSize: 24, lineHeight: 30, marginBottom: Spacing.two, fontWeight: '600' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: Spacing.three },
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
  passwordWrap: { justifyContent: 'center' },
  passwordInput: { marginBottom: 0, paddingRight: Spacing.three + 28 },
  eyeButton: { position: 'absolute', right: Spacing.three, padding: 4 },
  dobRow: { flexDirection: 'row', gap: Spacing.two },
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
  optionLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
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
  error: { color: '#ff453a', marginBottom: Spacing.two, fontSize: 14 },
  primaryButton: {
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  link: { color: '#3c87f7', textAlign: 'center', marginTop: Spacing.four, fontSize: 14 },
});
