import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CONTENT_TYPE_OPTIONS, TIME_SLOT_OPTIONS } from '@/constants/notification-options';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { FontScaleKey, ThemeMode, useThemePrefs } from '@/context/theme-prefs-context';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';
import type { NotificationContentType } from '@/lib/database.types';
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

export default function Settings() {
  const { user, signOut } = useAuth();
  const { profile, saveNotificationPreferences, updateDisplayName } = useProfile();
  const { themeMode, setThemeMode, fontScaleKey, setFontScaleKey } = useThemePrefs();
  const { uploading, error: avatarError, pickAndUpload } = useAvatarUpload();

  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [selectedTypes, setSelectedTypes] = useState<NotificationContentType[]>([]);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedTypes(profile.notification_types);
      setSelectedTime(profile.notification_time.slice(0, 5));
      setNameInput(profile.display_name ?? '');
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
            Settings
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.profileCard}>
            <Pressable onPress={pickAndUpload} disabled={uploading} style={styles.avatarWrap}>
              <Avatar url={profile?.avatar_url} fallbackLetter={initial} size={84} />
              <ThemedView style={styles.avatarEditBadge}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.avatarEditIcon}>📷</ThemedText>
                )}
              </ThemedView>
            </Pressable>

            <ThemedView style={styles.nameRow}>
              <TextInput
                value={nameInput}
                onChangeText={(text) => {
                  setNameInput(text);
                  setNameError(null);
                }}
                placeholder="Your name"
                placeholderTextColor="#8a8a8a"
                style={styles.nameInput}
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
            Notifications
          </ThemedText>
          {CONTENT_TYPE_OPTIONS.map((type) => {
            const selected = selectedTypes.includes(type.value);
            return (
              <Pressable
                key={type.value}
                onPress={() => toggleType(type.value)}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
              >
                <ThemedView
                  type="backgroundElement"
                  style={[styles.checkbox, selected && styles.checkboxSelected]}
                >
                  {selected && <ThemedText style={styles.checkboxMark}>✓</ThemedText>}
                </ThemedView>
                <ThemedText type="smallBold">{type.label}</ThemedText>
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
                  style={[styles.timeChip, selected && styles.timeChipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.timeChipTextSelected : undefined}>
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
            ) : (
              <ThemedText style={styles.saveButtonText}>{saved ? 'Saved ✓' : 'Save Preferences'}</ThemedText>
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
                style={[styles.segment, themeMode === opt.value && styles.segmentSelected]}
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
                style={[styles.segment, fontScaleKey === opt.value && styles.segmentSelected]}
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

          <Pressable style={styles.signOutButton} onPress={signOut}>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  title: { fontSize: 26, lineHeight: 32, marginBottom: Spacing.two },
  profileCard: {
    borderRadius: 12,
    padding: Spacing.four,
    gap: Spacing.two,
    marginBottom: Spacing.two,
    alignItems: 'center',
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.two },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e50914',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarEditIcon: { fontSize: 13 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    minWidth: 120,
    paddingVertical: 4,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  nameSaveButton: {
    backgroundColor: '#e50914',
    borderRadius: 8,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: 6,
  },
  nameSaveButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  errorText: { color: '#ff453a', textAlign: 'center' },
  profileEmail: { opacity: 0.6 },
  memberSince: { opacity: 0.45 },
  sectionHeading: { marginTop: Spacing.three, marginBottom: Spacing.two, opacity: 0.85 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two + 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    marginBottom: Spacing.two,
  },
  optionCardSelected: { borderColor: '#e50914' },
  checkbox: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#e50914' },
  checkboxMark: { color: '#fff', fontWeight: '700', fontSize: 12 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  timeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  timeChipSelected: { backgroundColor: '#e50914', borderColor: '#e50914' },
  timeChipTextSelected: { color: '#fff', fontWeight: '700' },
  saveButton: {
    backgroundColor: '#e50914',
    borderRadius: 10,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700' },
  segmentRow: { flexDirection: 'row', gap: Spacing.two },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  segmentSelected: { backgroundColor: '#e50914', borderColor: '#e50914' },
  segmentTextSelected: { color: '#fff', fontWeight: '700' },
  signOutButton: {
    marginTop: Spacing.four,
    borderWidth: 1,
    borderColor: '#e50914',
    borderRadius: 10,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  signOutText: { color: '#e50914', fontWeight: '700' },
  deleteButton: { marginTop: Spacing.two, alignItems: 'center', paddingVertical: Spacing.two },
  deleteButtonText: { color: '#ff453a', fontWeight: '600' },
});
