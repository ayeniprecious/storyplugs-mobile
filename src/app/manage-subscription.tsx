import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';

import { BackButton } from '@/components/back-button';
import { SettingsGroup } from '@/components/settings-group';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import { FREE_ARCHIVE_WINDOW_DAYS, STREAK_FREEZES_PER_MONTH } from '@/constants/premium';
import { useProfile } from '@/context/profile-context';
import { usePurchases } from '@/hooks/use-purchases';
import { useTheme } from '@/hooks/use-theme';

const FEATURES = [
  { label: 'Reader Mode', description: 'Auto-scroll, a dedicated reader theme, and font controls.' },
  { label: 'Full Archive Access', description: `Read stories older than ${FREE_ARCHIVE_WINDOW_DAYS} days.` },
  { label: 'Streak Freeze', description: `${STREAK_FREEZES_PER_MONTH} freezes a month to protect a missed day.` },
  { label: 'Journal', description: "Write and revisit your own reflections on every story." },
  { label: 'Offline Downloads', description: 'Save stories to read anytime, even without a signal.' },
  { label: 'Mood-Matched Picks', description: 'Get story picks matched to how you\'re feeling.' },
  { label: 'Comment Replies', description: 'Reply to other readers in the comments.' },
];

const FALLBACK_MANAGEMENT_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

function packageLabel(pkg: PurchasesPackage) {
  switch (pkg.packageType) {
    case 'ANNUAL':
      return 'Annual';
    case 'SIX_MONTH':
      return '6 Months';
    case 'THREE_MONTH':
      return '3 Months';
    case 'TWO_MONTH':
      return '2 Months';
    case 'MONTHLY':
      return 'Monthly';
    case 'WEEKLY':
      return 'Weekly';
    case 'LIFETIME':
      return 'Lifetime';
    default:
      return pkg.product.title;
  }
}

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
  const { profile, refreshProfile } = useProfile();
  const theme = useTheme();
  const isPremium = !!profile?.is_premium;
  const {
    available,
    loading,
    purchasing,
    error,
    packages,
    isPremiumFromStore,
    managementUrl,
    purchase,
    restore,
  } = usePurchases();
  const [justPurchased, setJustPurchased] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // profiles.is_premium is only ever set server-side, by the
  // revenuecat-webhook edge function reacting to the purchase event -- it
  // doesn't land the instant the store confirms payment. Poll the profile a
  // couple of times over the following seconds so the "You have full
  // access" state above appears without the user having to back out and
  // back in. isPremiumFromStore (read straight from the SDK) is what drives
  // the immediate on-screen confirmation instead.
  useEffect(() => {
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  async function handlePurchase(pkg: PurchasesPackage) {
    const { error: purchaseError } = await purchase(pkg);
    if (purchaseError) return;
    setJustPurchased(true);
    refreshProfile({ silent: true });
    refreshTimer.current = setTimeout(() => refreshProfile({ silent: true }), 4000);
  }

  async function handleRestore() {
    setRestoreMessage(null);
    const { error: restoreError } = await restore();
    if (restoreError) {
      setRestoreMessage(restoreError);
      return;
    }
    setRestoreMessage('Restored — checking your account…');
    refreshProfile({ silent: true });
    refreshTimer.current = setTimeout(() => refreshProfile({ silent: true }), 4000);
  }

  async function handleManageBilling() {
    const url = managementUrl ?? FALLBACK_MANAGEMENT_URL;
    try {
      await Linking.openURL(url);
    } catch {
      // nothing to recover from -- the platform simply couldn't open the link
    }
  }

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
          <ThemedView style={styles.planCard}>
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
            <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={handleManageBilling}>
              <ThemedText style={styles.secondaryButtonText}>Manage Billing</ThemedText>
            </Pressable>
          ) : !available ? (
            <ThemedView style={styles.noticeCard}>
              <Ionicons name="time-outline" size={18} color={theme.placeholder} />
              <ThemedText type="small" style={styles.noticeText}>
                Purchases aren't available in this preview — they only work in a real App Store/Play Store build.
              </ThemedText>
            </ThemedView>
          ) : loading ? (
            <ActivityIndicator color={theme.text} style={styles.loading} />
          ) : (justPurchased || isPremiumFromStore) ? (
            <ThemedView style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={18} color="#32b45a" />
              <ThemedText type="small" style={styles.successText}>
                Purchase confirmed — unlocking Premium now.
              </ThemedText>
            </ThemedView>
          ) : packages.length === 0 ? (
            <ThemedView style={styles.noticeCard}>
              <Ionicons name="time-outline" size={18} color={theme.placeholder} />
              <ThemedText type="small" style={styles.noticeText}>
                No plans are available to purchase yet — check back soon.
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={styles.plansList}>
              {packages.map((pkg) => (
                <Pressable
                  key={pkg.identifier}
                  style={styles.planOption}
                  onPress={() => handlePurchase(pkg)}
                  disabled={purchasing}
                >
                  <ThemedView style={styles.planOptionText}>
                    <ThemedText type="smallBold">{packageLabel(pkg)}</ThemedText>
                    <ThemedText type="small" style={styles.planOptionSub}>
                      {pkg.product.priceString}
                      {pkg.product.subscriptionPeriod ? ' / period' : ''}
                    </ThemedText>
                  </ThemedView>
                  {purchasing ? (
                    <ActivityIndicator color="#C01918" size="small" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#C01918" />
                  )}
                </Pressable>
              ))}
            </ThemedView>
          )}

          {error && (
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          )}

          {available && !isPremium && (
            <Pressable onPress={handleRestore} disabled={purchasing} style={styles.restoreButton}>
              <ThemedText type="small" style={styles.restoreButtonText}>
                Restore Purchases
              </ThemedText>
            </Pressable>
          )}
          {restoreMessage && (
            <ThemedText type="small" style={styles.restoreMessage}>
              {restoreMessage}
            </ThemedText>
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
    backgroundColor: CardAsh,
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
  loading: { marginTop: Spacing.three },
  plansList: { gap: Spacing.two, marginTop: Spacing.two },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: CardAsh,
  },
  planOptionText: { gap: 2, backgroundColor: 'transparent' },
  planOptionSub: { opacity: 0.6 },
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
    backgroundColor: CardAsh,
  },
  noticeText: { flex: 1, opacity: 0.8, lineHeight: 18 },
  successCard: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    backgroundColor: 'rgba(50,180,90,0.12)',
  },
  successText: { flex: 1, opacity: 0.9, lineHeight: 18 },
  errorText: { color: '#ff453a', marginTop: Spacing.two },
  restoreButton: { alignItems: 'center', paddingVertical: Spacing.three },
  restoreButtonText: { color: '#C01918', fontWeight: '600' },
  restoreMessage: { opacity: 0.6, textAlign: 'center' },
});
