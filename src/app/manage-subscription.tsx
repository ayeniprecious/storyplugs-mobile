import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { SettingsGroup } from '@/components/settings-group';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FREE_ARCHIVE_WINDOW_DAYS, STREAK_FREEZES_PER_MONTH } from '@/constants/premium';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/hooks/use-theme';

const FEATURES = [
  { label: 'Reader Mode', description: 'Auto-scroll, a dedicated reader theme, and font controls.' },
  { label: 'Full Archive Access', description: `Read stories older than ${FREE_ARCHIVE_WINDOW_DAYS} days.` },
  { label: 'Streak Freeze', description: `${STREAK_FREEZES_PER_MONTH} freezes a month to protect a missed day.` },
  { label: 'Journal', description: "Write and revisit your own reflections on every story." },
  { label: 'Offline Downloads', description: 'Save stories to read anytime, even without a signal.' },
];

function FeatureRow({
  label,
  description,
  unlocked,
  isLast,
}: {
  label: string;
  description: string;
  unlocked: boolean;
  isLast?: boolean;
}) {
  const theme = useTheme();
  return (
    <ThemedView
      style={[styles.featureRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
    >
      <Ionicons
        name={unlocked ? 'checkmark-circle' : 'lock-closed-outline'}
        size={18}
        color={unlocked ? '#32b45a' : theme.placeholder}
      />
      <ThemedView style={styles.featureTextGroup}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" style={styles.featureDescription}>
          {description}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

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
                ? 'You have full access to everything below.'
                : 'Upgrade to unlock the full archive, streak protection, journaling, and offline reading.'}
            </ThemedText>
          </ThemedView>

          <ThemedText type="small" style={styles.sectionHint}>
            What's included
          </ThemedText>
          <SettingsGroup>
            {FEATURES.map((feature, i) => (
              <FeatureRow
                key={feature.label}
                label={feature.label}
                description={feature.description}
                unlocked={isPremium}
                isLast={i === FEATURES.length - 1}
              />
            ))}
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
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
  },
  featureTextGroup: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  featureDescription: { opacity: 0.6 },
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
