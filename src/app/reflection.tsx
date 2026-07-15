import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useProfile } from '@/context/profile-context';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useReadingRecap } from '@/hooks/use-reading-recap';
import { useTheme } from '@/hooks/use-theme';
import type { RecapPeriod } from '@/lib/reading-recap';

export default function Reflection() {
  const { profile } = useProfile();
  const theme = useTheme();
  const { labels: categoryLabels } = useCategories();
  const { settings } = useAppSettings();
  const appName = settings.app_name || 'StoryPlugs';
  const [period, setPeriod] = useState<RecapPeriod>('month');
  const isPremium = !!profile?.is_premium;
  const { data, loading } = useReadingRecap(period);

  function handlePeriodChange(next: RecapPeriod) {
    if (next === period) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPeriod(next);
  }

  async function handleShare() {
    if (!data) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lines = [
      `My ${data.periodLabel} in Reflection — ${appName}`,
      `${data.storiesRead} stories read`,
      `${data.minutesRead} minutes of reading`,
      `${data.daysActive} days active, longest streak ${data.longestStreak} day${data.longestStreak === 1 ? '' : 's'}`,
    ];
    if (data.topCategory) {
      lines.push(`Mostly reading ${categoryLabels[data.topCategory.slug] ?? data.topCategory.slug}`);
    }
    if (data.journalCount > 0) {
      lines.push(`${data.journalCount} reflection${data.journalCount === 1 ? '' : 's'} written`);
    }
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // user cancelled or share sheet unavailable on this platform
    }
  }

  const isEmpty = !data || (data.storiesRead === 0 && data.daysActive === 0 && data.journalCount === 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            Your Reflection
          </ThemedText>
        </ThemedView>

        <ThemedView style={[styles.toggleRow, { borderColor: theme.border }]}>
          <Pressable
            style={[styles.toggleButton, period === 'month' && styles.toggleButtonActive]}
            onPress={() => handlePeriodChange('month')}
          >
            <ThemedText style={period === 'month' ? styles.toggleTextActive : styles.toggleText}>
              This Month
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, period === 'year' && styles.toggleButtonActive]}
            onPress={() => handlePeriodChange('year')}
          >
            <ThemedText style={period === 'year' ? styles.toggleTextActive : styles.toggleText}>
              This Year
            </ThemedText>
          </Pressable>
        </ThemedView>

        {!isPremium ? (
          <ThemedView style={styles.messageCard}>
            <Ionicons name="sparkles" size={32} color="#C01918" />
            <ThemedText type="smallBold" style={styles.messageTitle}>
              Your Reading, Wrapped
            </ThemedText>
            <ThemedText type="small" style={styles.messageBody}>
              See your stories read, minutes spent, streaks, and favorite category — a shareable recap of
              your reading journey. Premium unlocks it.
            </ThemedText>
            <Pressable style={styles.messageButton} onPress={() => router.push('/manage-subscription')}>
              <ThemedText style={styles.messageButtonText}>Unlock Premium</ThemedText>
            </Pressable>
          </ThemedView>
        ) : loading ? (
          <ActivityIndicator color={theme.text} style={styles.loading} />
        ) : isEmpty ? (
          <ThemedView style={styles.messageCard}>
            <Ionicons name="book-outline" size={32} color={theme.placeholder} />
            <ThemedText type="smallBold" style={styles.messageTitle}>
              Nothing here yet
            </ThemedText>
            <ThemedText type="small" style={styles.messageBody}>
              Read a story or two this {period === 'month' ? 'month' : 'year'} and your recap will show up
              here.
            </ThemedText>
          </ThemedView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <LinearGradient
              colors={['#FFD86B', '#C01918', '#7A1140']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coverCard}
            >
              <Ionicons name="sparkles" size={28} color="#fff" />
              <ThemedText style={styles.coverPeriod}>{data.periodLabel}</ThemedText>
              <ThemedText style={styles.coverTitle}>Your Reading Journey</ThemedText>
            </LinearGradient>

            <ThemedView style={styles.statGrid}>
              <ThemedView style={styles.statTile}>
                <ThemedText style={styles.statValue}>{data.storiesRead}</ThemedText>
                <ThemedText type="small" style={styles.statLabel}>
                  Stories Read
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.statTile}>
                <ThemedText style={styles.statValue}>{data.minutesRead}</ThemedText>
                <ThemedText type="small" style={styles.statLabel}>
                  Minutes Read
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.statTile}>
                <ThemedText style={styles.statValue}>{data.daysActive}</ThemedText>
                <ThemedText type="small" style={styles.statLabel}>
                  Days Active
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.statTile}>
                <ThemedText style={styles.statValue}>{data.longestStreak}</ThemedText>
                <ThemedText type="small" style={styles.statLabel}>
                  Longest Streak
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {data.topCategory && (
              <ThemedView style={styles.card}>
                <ThemedText type="small" style={styles.cardEyebrow}>
                  TOP CATEGORY
                </ThemedText>
                <ThemedText type="smallBold" style={styles.cardHeading}>
                  {categoryLabels[data.topCategory.slug] ?? data.topCategory.slug}
                </ThemedText>
                <ThemedText type="small" style={styles.cardSub}>
                  {data.topCategory.count} {data.topCategory.count === 1 ? 'story' : 'stories'}
                </ThemedText>
              </ThemedView>
            )}

            {data.highlightEntry && (
              <ThemedView style={styles.card}>
                <ThemedText type="small" style={styles.cardEyebrow}>
                  A REFLECTION THAT STUCK WITH YOU
                </ThemedText>
                <ThemedText style={styles.highlightText}>&ldquo;{data.highlightEntry.entry}&rdquo;</ThemedText>
                <ThemedText type="small" style={styles.cardSub}>
                  — on {data.highlightEntry.storyTitle}
                </ThemedText>
              </ThemedView>
            )}

            {data.journalCount > 0 && (
              <ThemedText type="small" style={styles.journalHint}>
                You wrote {data.journalCount} reflection{data.journalCount === 1 ? '' : 's'} this{' '}
                {period === 'month' ? 'month' : 'year'}.
              </ThemedText>
            )}

            <Pressable style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color="#fff" />
              <ThemedText style={styles.shareButtonText}>Share My Recap</ThemedText>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    marginBottom: Spacing.three,
  },
  toggleButton: { flex: 1, borderRadius: 8, paddingVertical: Spacing.two - 2, alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#C01918' },
  toggleText: { opacity: 0.7, fontWeight: '600' },
  toggleTextActive: { color: '#fff', fontWeight: '700' },
  loading: { marginTop: Spacing.six },
  messageCard: {
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    backgroundColor: CardAsh,
  },
  messageTitle: { fontSize: 17, textAlign: 'center' },
  messageBody: { opacity: 0.7, textAlign: 'center', lineHeight: 20 },
  messageButton: {
    marginTop: Spacing.two,
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  messageButtonText: { color: '#fff', fontWeight: '700' },
  scrollContent: { paddingBottom: Spacing.six, gap: Spacing.three },
  coverCard: {
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  coverPeriod: { color: '#fff', opacity: 0.85, fontWeight: '600', letterSpacing: 1 },
  coverTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 14,
    padding: Spacing.three,
    gap: 2,
    backgroundColor: CardAsh,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#C01918' },
  statLabel: { opacity: 0.7 },
  card: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: 4,
    backgroundColor: CardAsh,
  },
  cardEyebrow: { color: '#C01918', fontWeight: '700', letterSpacing: 0.5 },
  cardHeading: { fontSize: 17 },
  cardSub: { opacity: 0.6 },
  highlightText: { fontStyle: 'italic', lineHeight: 22, marginVertical: 2 },
  journalHint: { opacity: 0.7, textAlign: 'center' },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    backgroundColor: '#C01918',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  shareButtonText: { color: '#fff', fontWeight: '700' },
});
