import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CONTENT_TYPE_OPTIONS, TIME_SLOT_OPTIONS } from '@/constants/notification-options';
import { GOAL_OPTIONS, STORY_LENGTH_OPTIONS } from '@/constants/personalization-options';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useProfile } from '@/context/profile-context';
import { FontScaleKey, ThemeMode, useThemePrefs } from '@/context/theme-prefs-context';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationContentType, StoryLengthPref } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const FONT_OPTIONS: { value: FontScaleKey; label: string }[] = [
  { value: 'small', label: 'A' },
  { value: 'medium', label: 'A' },
  { value: 'large', label: 'A' },
  { value: 'xlarge', label: 'A' },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, saveNotificationPreferences, savePersonalization, updateDisplayName } = useProfile();
  const { order: categoryOrder, labels: categoryLabels } = useCategories();
  const { themeMode, setThemeMode, fontScaleKey, setFontScaleKey } = useThemePrefs();
  const { uploading, error: avatarError, pickAndUpload } = useAvatarUpload();
  const theme = useTheme();

  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);

  const [selectedTypes, setSelectedTypes] = useState<NotificationContentType[]>([]);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [storyLength, setStoryLength] = useState<StoryLengthPref>('any');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedTypes(profile.notification_types);
      setSelectedTime(profile.notification_time.slice(0, 5));
      setNameInput(profile.display_name ?? '');
      setInterests(profile.interests);
      setGoals(profile.personal_goals);
      setStoryLength(profile.story_length_pref ?? 'any');
    }
  }, [profile]);

  const initial = (profile?.display_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();
  const nameChanged = nameInput.trim() !== (profile?.display_name ?? '') && nameInput.trim() !== '';

  async function handleSaveName() {
    setSavingName(true);
    setNameError(null);
    const { error } = await updateDisplayName(nameInput);
    setSavingName(false);
    if (error) setNameError(error);
  }

  function toggleType(value: NotificationContentType) {
    setSaved(false);
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSavePreferences() {
    if (selectedTypes.length === 0) return;
    setSaving(true);
    await saveNotificationPreferences(selectedTypes, selectedTime);
    setSaving(false);
    setSaved(true);
  }

  function toggleInterest(value: string) {
    setPrefsSaved(false);
    setInterests((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function toggleGoal(value: string) {
    setPrefsSaved(false);
    setGoals((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleSavePrefs() {
    setSavingPrefs(true);
    await savePersonalization(interests, goals, storyLength);
    setSavingPrefs(false);
    setPrefsSaved(true);
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordChanged(false);
    if (!currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    setChangingPassword(true);
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: currentPassword,
    });
    if (reauthError) {
      setChangingPassword(false);
      setPasswordError('Current password is incorrect.');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setPasswordChanged(true);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDeleteAccount },
      ]
    );
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const { error } = await supabase.functions.invoke('delete-account');
    setDeleting(false);
    if (error) {
      Alert.alert('Couldn’t delete account', error.message);
      return;
    }
    await signOut();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.title}>
            Profile
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.profileCard}>
            <ThemedView style={styles.avatarWrap}>
              <Pressable
                onPress={() => (profile?.avatar_url ? setAvatarViewerOpen(true) : pickAndUpload())}
                disabled={uploading}
              >
                <Avatar url={profile?.avatar_url} fallbackLetter={initial} size={84} />
              </Pressable>
              <Pressable onPress={pickAndUpload} disabled={uploading} style={styles.avatarEditBadge}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </Pressable>
            </ThemedView>

            <ThemedView style={styles.nameRow}>
              <TextInput
                value={nameInput}
                onChangeText={(text) => {
                  setNameInput(text);
                  setNameError(null);
                }}
                placeholder="Your name"
                placeholderTextColor={theme.placeholder}
                style={[styles.nameInput, { color: theme.text }]}
              />
              {nameChanged && (
                <Pressable onPress={handleSaveName} style={styles.nameSaveButton} disabled={savingName}>
                  {savingName ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.nameSaveButtonText}>Save</ThemedText>
                  )}
                </Pressable>
              )}
            </ThemedView>
            {nameError && (
              <ThemedText type="small" style={styles.errorText}>
                {nameError}
              </ThemedText>
            )}
            {avatarError && (
              <ThemedText type="small" style={styles.errorText}>
                {avatarError}
              </ThemedText>
            )}

            <ThemedText type="small" style={styles.profileEmail}>
              {user?.email}
            </ThemedText>
            {profile?.created_at && (
              <ThemedText type="small" style={styles.memberSince}>
                Member since{' '}
                {new Date(profile.created_at).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </ThemedText>
            )}
          </ThemedView>

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Preferences
          </ThemedText>
          <ThemedText type="small" style={styles.sectionHint}>
            Themes you love
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {categoryOrder.map((slug) => {
              const selected = interests.includes(slug);
              return (
                <Pressable
                  key={slug}
                  onPress={() => toggleInterest(slug)}
                  style={[styles.chip, { borderColor: theme.border }, selected && styles.chipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                    {categoryLabels[slug] ?? slug}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <ThemedText type="small" style={styles.sectionHint}>
            What brings you here
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {GOAL_OPTIONS.map((goal) => {
              const selected = goals.includes(goal.value);
              return (
                <Pressable
                  key={goal.value}
                  onPress={() => toggleGoal(goal.value)}
                  style={[styles.chip, { borderColor: theme.border }, selected && styles.chipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                    {goal.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <ThemedText type="small" style={styles.sectionHint}>
            Preferred story length
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {STORY_LENGTH_OPTIONS.map((option) => {
              const selected = storyLength === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setPrefsSaved(false);
                    setStoryLength(option.value);
                  }}
                  style={[styles.chip, { borderColor: theme.border }, selected && styles.chipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <Pressable style={styles.saveButton} onPress={handleSavePrefs} disabled={savingPrefs}>
            {savingPrefs ? (
              <ActivityIndicator color="#fff" />
            ) : prefsSaved ? (
              <ThemedView style={styles.saveButtonContent}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <ThemedText style={styles.saveButtonText}>Saved</ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={styles.saveButtonText}>Save Preferences</ThemedText>
            )}
          </Pressable>

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Notifications
          </ThemedText>
          {CONTENT_TYPE_OPTIONS.map((type) => {
            const selected = selectedTypes.includes(type.value);
            return (
              <Pressable
                key={type.value}
                onPress={() => toggleType(type.value)}
                style={[styles.optionCard, { borderColor: theme.border }]}
              >
                <ThemedView
                  type="backgroundElement"
                  style={[styles.checkbox, selected && styles.checkboxSelected]}
                >
                  {selected && <Ionicons name="checkmark" size={13} color="#fff" />}
                </ThemedView>
                <ThemedText type="small">{type.label}</ThemedText>
              </Pressable>
            );
          })}

          <ThemedView style={styles.timeRow}>
            {TIME_SLOT_OPTIONS.map((slot) => {
              const selected = selectedTime === slot.value;
              return (
                <Pressable
                  key={slot.value}
                  onPress={() => {
                    setSaved(false);
                    setSelectedTime(slot.value);
                  }}
                  style={[styles.timeChip, { borderColor: theme.border }, selected && styles.timeChipSelected]}
                >
                  <ThemedText
                    type="small"
                    style={[styles.timeChipText, selected && styles.timeChipTextSelected]}
                  >
                    {slot.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <Pressable
            style={styles.saveButton}
            onPress={handleSavePreferences}
            disabled={saving || selectedTypes.length === 0}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : saved ? (
              <ThemedView style={styles.saveButtonContent}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <ThemedText style={styles.saveButtonText}>Saved</ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={styles.saveButtonText}>Save Preferences</ThemedText>
            )}
          </Pressable>

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Appearance
          </ThemedText>
          <ThemedView style={styles.segmentRow}>
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setThemeMode(opt.value)}
                style={[
                  styles.segment,
                  { borderColor: theme.border },
                  themeMode === opt.value && styles.segmentSelected,
                ]}
              >
                <ThemedText
                  type="small"
                  style={themeMode === opt.value ? styles.segmentTextSelected : undefined}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Text Size
          </ThemedText>
          <ThemedView style={styles.segmentRow}>
            {FONT_OPTIONS.map((opt, i) => (
              <Pressable
                key={opt.value}
                onPress={() => setFontScaleKey(opt.value)}
                style={[
                  styles.segment,
                  { borderColor: theme.border },
                  fontScaleKey === opt.value && styles.segmentSelected,
                ]}
              >
                <ThemedText
                  style={[
                    { fontSize: 14 + i * 3 },
                    fontScaleKey === opt.value ? styles.segmentTextSelected : undefined,
                  ]}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>

          <ThemedText type="smallBold" style={styles.sectionHeading}>
            Change Password
          </ThemedText>
          <ThemedView style={styles.passwordFieldWrap}>
            <TextInput
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setPasswordError(null);
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
                setPasswordError(null);
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
          {passwordError && (
            <ThemedText type="small" style={styles.errorText}>
              {passwordError}
            </ThemedText>
          )}
          <Pressable style={styles.saveButton} onPress={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? (
              <ActivityIndicator color="#fff" />
            ) : passwordChanged ? (
              <ThemedView style={styles.saveButtonContent}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <ThemedText style={styles.saveButtonText}>Password Updated</ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={styles.saveButtonText}>Update Password</ThemedText>
            )}
          </Pressable>

          <Pressable style={[styles.signOutButton, { borderColor: theme.border }]} onPress={signOut}>
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDeleteAccount} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator color="#ff453a" />
            ) : (
              <ThemedText style={styles.deleteButtonText}>Delete Account</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={avatarViewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarViewerOpen(false)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setAvatarViewerOpen(false)}>
          {profile?.avatar_url && (
            <Image source={{ uri: profile.avatar_url }} style={styles.viewerImage} contentFit="contain" />
          )}
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  title: { fontSize: 24, lineHeight: 30, marginBottom: Spacing.two },
  profileCard: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.two,
    alignItems: 'center',
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.two, backgroundColor: 'transparent' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#700a0a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  nameInput: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 120,
    paddingVertical: 4,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  nameSaveButton: {
    backgroundColor: '#700a0a',
    borderRadius: 8,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: 6,
  },
  nameSaveButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  errorText: { color: '#ff453a', textAlign: 'center' },
  profileEmail: { opacity: 0.6 },
  memberSince: { opacity: 0.45 },
  sectionHeading: { marginTop: Spacing.three, marginBottom: Spacing.two, opacity: 0.85 },
  sectionHint: { opacity: 0.6, marginBottom: 2 },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 4,
    marginBottom: Spacing.two,
    backgroundColor: 'transparent',
  },
  chip: {
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.one + 3,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipSelected: { backgroundColor: '#700a0a', borderColor: '#700a0a' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: Spacing.one + 4,
  },
  checkbox: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#700a0a' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 4, marginBottom: Spacing.two },
  timeChip: {
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.one + 3,
    borderRadius: 16,
    borderWidth: 1,
  },
  timeChipSelected: { backgroundColor: 'rgba(112, 10, 10,0.14)', borderColor: '#700a0a' },
  timeChipText: { opacity: 0.85 },
  timeChipTextSelected: { color: '#700a0a', fontWeight: '600', opacity: 1 },
  saveButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  segmentRow: { flexDirection: 'row', gap: Spacing.one + 4 },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentSelected: { backgroundColor: 'rgba(112, 10, 10,0.14)', borderColor: '#700a0a' },
  segmentTextSelected: { color: '#700a0a', fontWeight: '600' },
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
  signOutButton: {
    marginTop: Spacing.three,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
  },
  signOutText: { fontWeight: '600', opacity: 0.85 },
  deleteButton: { marginTop: Spacing.one, alignItems: 'center', paddingVertical: Spacing.two },
  deleteButtonText: { color: '#ff453a', fontWeight: '500', opacity: 0.85 },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: { width: '100%', height: '80%' },
});
