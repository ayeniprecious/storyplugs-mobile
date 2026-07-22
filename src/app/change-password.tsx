import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function ChangePassword() {
  const { user } = useAuth();
  const theme = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  async function handleChangePassword() {
    setError(null);
    setChanged(false);
    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setChanging(true);
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: currentPassword,
    });
    if (reauthError) {
      setChanging(false);
      setError('Current password is incorrect.');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setChanging(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setChanged(true);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            Change Password
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.passwordFieldWrap}>
            <TextInput
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setError(null);
              }}
              placeholder="Current password"
              placeholderTextColor={theme.placeholder}
              secureTextEntry={!showCurrentPassword}
              style={[styles.passwordInput, { borderColor: theme.border, color: theme.text }]}
            />
            <Pressable
              onPress={() => setShowCurrentPassword((v) => !v)}
              style={styles.passwordEyeButton}
              hitSlop={8}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={theme.placeholder}
              />
            </Pressable>
          </ThemedView>
          <ThemedView style={styles.passwordFieldWrap}>
            <TextInput
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setError(null);
              }}
              placeholder="New password (min. 6 characters)"
              placeholderTextColor={theme.placeholder}
              secureTextEntry={!showNewPassword}
              style={[styles.passwordInput, { borderColor: theme.border, color: theme.text }]}
            />
            <Pressable onPress={() => setShowNewPassword((v) => !v)} style={styles.passwordEyeButton} hitSlop={8}>
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={theme.placeholder}
              />
            </Pressable>
          </ThemedView>
          {error && (
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          )}
          <Pressable style={styles.saveButton} onPress={handleChangePassword} disabled={changing}>
            {changing ? (
              <ActivityIndicator color="#fff" />
            ) : changed ? (
              <ThemedView style={styles.saveButtonContent}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <ThemedText style={styles.saveButtonText}>Password Updated</ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={styles.saveButtonText}>Update Password</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  scrollContent: { paddingBottom: Spacing.six },
  passwordFieldWrap: { justifyContent: 'center', marginBottom: Spacing.two, backgroundColor: 'transparent' },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    paddingRight: Spacing.three + 28,
    fontSize: 16,
  },
  passwordEyeButton: { position: 'absolute', right: Spacing.three, padding: 4 },
  errorText: { color: '#ff453a', marginBottom: Spacing.two },
  saveButton: {
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  saveButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
});
