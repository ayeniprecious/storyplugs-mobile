import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { SettingsGroup } from '@/components/settings-group';
import { SettingsRow } from '@/components/settings-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { useReadingStreak } from '@/hooks/use-reading-streak';
import { useStreakFreeze } from '@/hooks/use-streak-freeze';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { currentStreak, longestStreak, loading: streakLoading } = useReadingStreak();
  const { freezesAvailable, canSaveStreak, applying: applyingFreeze, error: freezeError, applyFreeze } =
    useStreakFreeze();
  const theme = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const initial = (profile?.display_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : '–';

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  // react-native-web has no Alert.alert UI at all -- tapping Delete Account
  // silently did nothing on web. A real Modal works identically everywhere.
  async function handleDeleteAccount() {
    setConfirmingDelete(false);
    setDeleting(true);
    setDeleteError(null);
    const { error } = await supabase.functions.invoke('delete-account');
    setDeleting(false);
    if (error) {
      setDeleteError(error.message);
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

          {canSaveStreak && (
            <ThemedView type="backgroundElement" style={styles.freezeBanner}>
              <Ionicons name="snow" size={18} color="#3c87f7" />
              <ThemedView style={styles.freezeBannerTextGroup}>
                <ThemedText type="smallBold">Save your streak?</ThemedText>
                <ThemedText type="small" style={styles.freezeBannerBody}>
                  You missed yesterday — use a Streak Freeze to keep it going.
                </ThemedText>
                {freezeError && (
                  <ThemedText type="small" style={styles.freezeErrorText}>
                    {freezeError}
                  </ThemedText>
                )}
              </ThemedView>
              <Pressable style={styles.freezeButton} onPress={applyFreeze} disabled={applyingFreeze}>
                {applyingFreeze ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.freezeButtonText}>Use Freeze</ThemedText>
                )}
              </Pressable>
            </ThemedView>
          )}

          <ThemedView type="backgroundElement" style={styles.statsCard}>
            <ThemedView style={styles.statTile}>
              <Ionicons name="flame" size={20} color="#C01918" />
              <ThemedText type="smallBold" style={styles.statValue}>
                {streakLoading ? '–' : currentStreak}
              </ThemedText>
              <ThemedText type="small" style={styles.statLabel}>
                Day Streak
              </ThemedText>
              {profile?.is_premium && (
                <ThemedText type="small" style={styles.freezeCountLabel}>
                  {freezesAvailable} freeze{freezesAvailable === 1 ? '' : 's'} left
                </ThemedText>
              )}
            </ThemedView>
            <ThemedView style={styles.statDivider} />
            <ThemedView style={styles.statTile}>
              <Ionicons name="trophy" size={20} color="#C01918" />
              <ThemedText type="smallBold" style={styles.statValue}>
                {streakLoading ? '–' : longestStreak}
              </ThemedText>
              <ThemedText type="small" style={styles.statLabel}>
                Best Streak
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.statDivider} />
            <ThemedView style={styles.statTile}>
              <Ionicons name="calendar-outline" size={20} color={theme.placeholder} />
              <ThemedText type="smallBold" style={styles.statValue}>
                {memberSince}
              </ThemedText>
              <ThemedText type="small" style={styles.statLabel}>
                Member Since
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <SettingsGroup>
            <SettingsRow
              label="Subscription"
              href="/manage-subscription"
              showChevron
              isLast
              right={
                <ThemedView style={[styles.planBadge, profile?.is_premium && styles.planBadgePremium]}>
                  <ThemedText
                    type="small"
                    style={profile?.is_premium ? styles.planBadgeTextPremium : styles.planBadgeText}
                  >
                    {profile?.is_premium ? 'Premium' : 'Free'}
                  </ThemedText>
                </ThemedView>
              }
            />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow label="Preferences" href="/preferences" showChevron />
            <SettingsRow label="Notifications" href="/notification-settings" showChevron />
            <SettingsRow label="My Journal" href="/journal" showChevron />
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
            <SettingsRow
              label={signingOut ? 'Signing Out…' : 'Sign Out'}
              onPress={handleSignOut}
              disabled={signingOut}
              right={signingOut ? <ActivityIndicator size="small" color={theme.text} /> : undefined}
              isLast
            />
          </SettingsGroup>

          <Pressable onPress={() => setConfirmingDelete(true)} disabled={deleting} style={styles.deleteButton}>
            {deleting ? (
              <ActivityIndicator color="#ff453a" />
            ) : (
              <ThemedText style={styles.deleteButtonText}>Delete Account</ThemedText>
            )}
          </Pressable>
          {deleteError && (
            <ThemedText type="small" style={styles.deleteErrorText}>
              {deleteError}
            </ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={confirmingDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingDelete(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmingDelete(false)}>
          <ThemedView type="backgroundElement" style={styles.modalCard}>
            <ThemedText type="smallBold" style={styles.modalTitle}>
              Delete Account
            </ThemedText>
            <ThemedText type="small" style={styles.modalBody}>
              This permanently deletes your account and all your data. This cannot be undone.
            </ThemedText>
            <ThemedView style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => setConfirmingDelete(false)}
              >
                <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalDeleteButton]} onPress={handleDeleteAccount}>
                <ThemedText style={styles.modalDeleteText}>Delete</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.four,
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
  freezeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  freezeBannerTextGroup: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  freezeBannerBody: { opacity: 0.7 },
  freezeErrorText: { color: '#ff453a' },
  freezeButton: {
    backgroundColor: '#3c87f7',
    borderRadius: 10,
    paddingVertical: Spacing.two - 2,
    paddingHorizontal: Spacing.two + 4,
  },
  freezeButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  freezeCountLabel: { opacity: 0.5, fontSize: 11 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.three,
  },
  statTile: { flex: 1, alignItems: 'center', gap: 2, backgroundColor: 'transparent' },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(128,128,128,0.3)' },
  statValue: { fontSize: 16 },
  statLabel: { opacity: 0.6 },
  planBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  planBadgePremium: { backgroundColor: '#C01918' },
  planBadgeText: { opacity: 0.7 },
  planBadgeTextPremium: { color: '#fff', fontWeight: '700' },
  deleteButton: { alignItems: 'center', paddingVertical: Spacing.two },
  deleteButtonText: { color: '#ff453a', fontWeight: '500', opacity: 0.85 },
  deleteErrorText: { color: '#ff453a', textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  modalTitle: { fontSize: 17 },
  modalBody: { opacity: 0.75, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two, backgroundColor: 'transparent' },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  modalCancelText: { fontWeight: '600' },
  modalDeleteButton: { backgroundColor: '#ff453a', borderColor: '#ff453a' },
  modalDeleteText: { color: '#fff', fontWeight: '600' },
});
