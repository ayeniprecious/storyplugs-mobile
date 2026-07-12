import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { SettingsGroup } from '@/components/settings-group';
import { SettingsRow } from '@/components/settings-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/hooks/use-theme';

export default function ManageSubscription() {
  const { profile } = useProfile();
  const theme = useTheme();
  const [showNotice, setShowNotice] = useState(false);
  const isPremium = !!profile?.is_premium;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            Subscription
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView type="backgroundElement" style={styles.planCard}>
            <Ionicons
              name={isPremium ? 'star' : 'star-outline'}
              size={28}
              color={isPremium ? '#C01918' : theme.placeholder}
            />
            <ThemedText type="smallBold" style={styles.planTitle}>
              {isPremium ? 'Premium Plan' : 'Free Plan'}
            </ThemedText>
            <ThemedText type="small" style={styles.planBody}>
              {isPremium
                ? "You have full access to Reader Mode's auto-scroll, dedicated reader theme, and font controls."
                : "Upgrade to unlock Reader Mode's auto-scroll, dedicated reader theme, and custom font sizing."}
            </ThemedText>
          </ThemedView>

          <ThemedText type="small" style={styles.sectionHint}>
            What's included
          </ThemedText>
          <SettingsGroup>
            <SettingsRow
              label="Reader Mode"
              right={
                <Ionicons
                  name={isPremium ? 'checkmark-circle' : 'lock-closed-outline'}
                  size={18}
                  color={isPremium ? '#32b45a' : theme.placeholder}
                />
              }
            />
            <SettingsRow
              label="More premium perks"
              isLast
              right={
                <ThemedText type="small" style={styles.comingSoonText}>
                  Coming soon
                </ThemedText>
              }
            />
          </SettingsGroup>

          {isPremium ? (
            <Pressable
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => setShowNotice(true)}
            >
              <ThemedText style={styles.secondaryButtonText}>Manage Billing</ThemedText>
            </Pressable>
          ) : (
            <Pressable style={styles.upgradeButton} onPress={() => setShowNotice(true)}>
              <ThemedText style={styles.upgradeButtonText}>Upgrade to Premium</ThemedText>
            </Pressable>
          )}

          {showNotice && (
            <ThemedView type="backgroundElement" style={styles.noticeCard}>
              <Ionicons name="time-outline" size={18} color={theme.placeholder} />
              <ThemedText type="small" style={styles.noticeText}>
                {isPremium
                  ? "Billing management isn't live yet — check back soon."
                  : "Subscriptions aren't live yet — we'll let you know the moment Premium is ready to purchase."}
              </ThemedText>
            </ThemedView>
          )}
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
  planCard: {
    borderRadius: 12,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  planTitle: { fontSize: 17 },
  planBody: { opacity: 0.7, textAlign: 'center', lineHeight: 20 },
  sectionHint: { opacity: 0.6, marginBottom: Spacing.two },
  comingSoonText: { opacity: 0.6 },
  upgradeButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  upgradeButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  secondaryButtonText: { fontWeight: '600' },
  noticeCard: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  noticeText: { flex: 1, opacity: 0.8, lineHeight: 18 },
});
