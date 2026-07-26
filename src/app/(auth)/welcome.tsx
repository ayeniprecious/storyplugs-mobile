import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGradient, Spacing } from '@/constants/theme';
import { useThemePrefs } from '@/context/theme-prefs-context';
import { useTheme } from '@/hooks/use-theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; blurb: string }[] = [
  {
    icon: 'book-outline',
    title: 'A story every day',
    blurb: 'Moments of hope, kindness, and faith.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Made for you',
    blurb: 'Tell us what lifts you — we match stories to it.',
  },
  {
    icon: 'notifications-outline',
    title: 'A gentle daily nudge',
    blurb: 'Delivered at the time you choose.',
  },
];

export default function Welcome() {
  const theme = useTheme();
  const { resolvedScheme } = useThemePrefs();

  return (
    <LinearGradient colors={AuthGradient[resolvedScheme]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.brandBlock}>
          <Image
            source={require('@/assets/images/logo-mark.png')}
            style={styles.logoMark}
            resizeMode="contain"
          />
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Stories that prove humanity isn&apos;t lost.
          </Text>
        </View>

        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={22} color="#C01918" />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                <Text style={[styles.featureBlurb, { color: theme.textSecondary }]}>{feature.blurb}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.buttonBlock}>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable style={StyleSheet.flatten([styles.secondaryButton, { borderColor: theme.border }])}>
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>I already have an account</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.four,
    justifyContent: 'space-between',
  },
  brandBlock: { alignItems: 'center', marginTop: Spacing.six },
  logoMark: { width: 140, height: 140, marginBottom: Spacing.two },
  tagline: { fontSize: 15, marginTop: Spacing.two },
  featureList: { gap: Spacing.three },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(192, 25, 24,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { fontSize: 15, fontWeight: '600' },
  featureBlurb: { fontSize: 13, lineHeight: 18 },
  buttonBlock: { gap: Spacing.two },
  primaryButton: {
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
  },
  secondaryButtonText: { fontWeight: '500', fontSize: 14 },
});
