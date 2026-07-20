import { forwardRef } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import { ThemedText } from '@/components/themed-text';
import type { RecapData } from '@/lib/reading-recap';

export const RECAP_CARD_WIDTH = 360;
export const RECAP_CARD_HEIGHT = 640;

interface RecapShareCardProps {
  data: RecapData;
  appName: string;
  topCategoryLabel: string | null;
}

// Fixed-size, purely visual -- captured off-screen via react-native-view-shot to
// produce the actual shareable/downloadable image. Never rendered interactively,
// so nothing in here needs to handle touches.
export const RecapShareCard = forwardRef<ViewShotRef, RecapShareCardProps>(function RecapShareCard(
  { data, appName, topCategoryLabel },
  ref
) {
  return (
    <ViewShot ref={ref} options={{ format: 'png', quality: 1 }}>
      <LinearGradient
        colors={['#FFD86B', '#C01918', '#7A1140']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.brandRow}>
          <Image source={require('@/assets/images/logo-mark.png')} style={styles.logo} contentFit="contain" />
          <ThemedText style={styles.brandName}>{appName}</ThemedText>
        </View>

        <View style={styles.titleBlock}>
          <ThemedText style={styles.periodLabel}>{data.periodLabel.toUpperCase()}</ThemedText>
          <ThemedText style={styles.title}>My Reading{'\n'}Journey</ThemedText>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statTile}>
            <ThemedText style={styles.statValue}>{data.storiesRead}</ThemedText>
            <ThemedText style={styles.statLabel}>Stories Read</ThemedText>
          </View>
          <View style={styles.statTile}>
            <ThemedText style={styles.statValue}>{data.minutesRead}</ThemedText>
            <ThemedText style={styles.statLabel}>Minutes Read</ThemedText>
          </View>
          <View style={styles.statTile}>
            <ThemedText style={styles.statValue}>{data.daysActive}</ThemedText>
            <ThemedText style={styles.statLabel}>Days Active</ThemedText>
          </View>
          <View style={styles.statTile}>
            <ThemedText style={styles.statValue}>{data.longestStreak}</ThemedText>
            <ThemedText style={styles.statLabel}>Longest Streak</ThemedText>
          </View>
        </View>

        {topCategoryLabel && (
          <View style={styles.categoryPill}>
            <ThemedText style={styles.categoryPillText}>Mostly reading {topCategoryLabel}</ThemedText>
          </View>
        )}

        <ThemedText style={styles.footer}>storyplugs.com</ThemedText>
      </LinearGradient>
    </ViewShot>
  );
});

const styles = StyleSheet.create({
  card: {
    width: RECAP_CARD_WIDTH,
    height: RECAP_CARD_HEIGHT,
    padding: 28,
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 30, height: 30, borderRadius: 15 },
  brandName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  titleBlock: { gap: 4 },
  periodLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 13, letterSpacing: 1.5 },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', lineHeight: 39 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statTile: {
    flexBasis: '46%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 16,
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  statValue: { color: '#fff', fontSize: 30, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  categoryPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  categoryPillText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  footer: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: 13, textAlign: 'center' },
});
