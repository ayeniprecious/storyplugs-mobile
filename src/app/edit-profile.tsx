import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';
import { useTheme } from '@/hooks/use-theme';

export default function EditProfile() {
  const { user } = useAuth();
  const { profile, updateDisplayName } = useProfile();
  const { uploading, error: avatarError, pickAndUpload } = useAvatarUpload();
  const theme = useTheme();

  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);

  useEffect(() => {
    if (profile) setNameInput(profile.display_name ?? '');
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            Edit Profile
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.avatarWrap}>
            <Pressable
              onPress={() => (profile?.avatar_url ? setAvatarViewerOpen(true) : pickAndUpload())}
              disabled={uploading}
            >
              <Avatar url={profile?.avatar_url} fallbackLetter={initial} size={96} />
            </Pressable>
            <Pressable
              onPress={pickAndUpload}
              disabled={uploading}
              style={[styles.avatarEditBadge, { borderColor: theme.background }]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </Pressable>
          </ThemedView>
          {avatarError && (
            <ThemedText type="small" style={styles.errorText}>
              {avatarError}
            </ThemedText>
          )}

          <ThemedText type="small" style={styles.fieldLabel}>
            Name
          </ThemedText>
          <ThemedView style={styles.nameRow}>
            <TextInput
              value={nameInput}
              onChangeText={(text) => {
                setNameInput(text);
                setNameError(null);
              }}
              placeholder="Your name"
              placeholderTextColor={theme.placeholder}
              style={[styles.nameInput, { borderColor: theme.border, color: theme.text }]}
            />
            {nameChanged && (
              <Pressable onPress={handleSaveName} disabled={savingName} hitSlop={8}>
                {savingName ? (
                  <ActivityIndicator size="small" color="#C01918" />
                ) : (
                  <ThemedText style={styles.saveLink}>Save</ThemedText>
                )}
              </Pressable>
            )}
          </ThemedView>
          {nameError && (
            <ThemedText type="small" style={styles.errorText}>
              {nameError}
            </ThemedText>
          )}

          <ThemedText type="small" style={styles.fieldLabel}>
            Email
          </ThemedText>
          <ThemedText style={styles.readonlyValue}>{user?.email}</ThemedText>

          {profile?.created_at && (
            <ThemedText type="small" style={styles.memberSince}>
              Member since{' '}
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </ThemedText>
          )}
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
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  scrollContent: { alignItems: 'center', paddingBottom: Spacing.six },
  avatarWrap: { position: 'relative', marginTop: Spacing.two, marginBottom: Spacing.three, backgroundColor: 'transparent' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C01918',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  fieldLabel: { alignSelf: 'flex-start', opacity: 0.6, marginTop: Spacing.two, marginBottom: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  saveLink: { color: '#C01918', fontWeight: '600' },
  errorText: { color: '#ff453a', alignSelf: 'flex-start' },
  readonlyValue: { alignSelf: 'flex-start', opacity: 0.8, fontSize: 16 },
  memberSince: { alignSelf: 'flex-start', opacity: 0.45, marginTop: Spacing.three },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: { width: '100%', height: '80%' },
});
