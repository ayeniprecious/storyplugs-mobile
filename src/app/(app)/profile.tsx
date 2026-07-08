import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { SettingsGroup } from '@/components/settings-group';
import { SettingsRow } from '@/components/settings-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const theme = useTheme();
  const [deleting, setDeleting] = useState(false);

  const initial = (profile?.display_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();

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

          <Link href="/edit-profile" asChild>
            <Pressable>
              <ThemedView type="backgroundElement" style={styles.banner}>
                <Avatar url={profile?.avatar_url} fallbackLetter={initial} size={56} />
                <ThemedView style={styles.bannerTextGroup}>
                  <ThemedText type="smallBold">{profile?.display_name || 'Add your name'}</ThemedText>
                  <ThemedText type="small" style={styles.bannerEmail}>
                    {user?.email}
                  </ThemedText>
                </ThemedView>
                <Ionicons name="chevron-forward" size={18} color={theme.placeholder} />
              </ThemedView>
            </Pressable>
          </Link>

          <SettingsGroup>
            <SettingsRow label="Preferences" href="/preferences" showChevron />
            <SettingsRow label="Notifications" href="/notification-settings" showChevron />
            <SettingsRow label="Appearance" href="/appearance" showChevron isLast />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow label="Change Password" href="/change-password" showChevron isLast />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow label="Help" href="/help" showChevron />
            <SettingsRow label="Feedback" href="/feedback" showChevron />
            <SettingsRow label="About" href="/about" showChevron />
            <SettingsRow label="Privacy" href="/privacy" showChevron isLast />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow label="Sign Out" onPress={signOut} isLast />
          </SettingsGroup>

          <Pressable onPress={confirmDeleteAccount} disabled={deleting} style={styles.deleteButton}>
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
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: { fontSize: 24, lineHeight: 30, marginBottom: Spacing.two },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  bannerTextGroup: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  bannerEmail: { opacity: 0.6 },
  deleteButton: { alignItems: 'center', paddingVertical: Spacing.two },
  deleteButtonText: { color: '#ff453a', fontWeight: '500', opacity: 0.85 },
});
