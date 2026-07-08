import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; blurb: string }[] = [
  {
    icon: 'book-outline',
    title: 'A true story every day',
    blurb: 'Real moments of hope, kindness, and faith.',
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
  return (
    <LinearGradient colors={['#2a070b', '#000000']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.brandBlock}>
          <Image
            source={require('@/assets/images/logo-mark.png')}
            style={styles.logoMark}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Your daily emotional vitamin</Text>
        </View>

        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={22} color="#700a0a" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureBlurb}>{feature.blurb}</Text>
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
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
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
  tagline: { color: 'rgba(255,255,255,0.65)', fontSize: 15, marginTop: Spacing.two },
  featureList: { gap: Spacing.three },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(112, 10, 10,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  featureBlurb: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 18 },
  buttonBlock: { gap: Spacing.two },
  primaryButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#fff', fontWeight: '500', fontSize: 14 },
});
