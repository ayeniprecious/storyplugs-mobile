import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppSettings } from '@/hooks/use-app-settings';

export default function About() {
  const { settings } = useAppSettings();
  const appName = settings.app_name || 'StoryPlugs';
  const logoUrl = settings.logo_url || null;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            About
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.centerBlock}>
          <Image
            source={logoUrl ? { uri: logoUrl } : require('@/assets/images/logo-mark.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText type="title" style={styles.appName}>
            {appName}
          </ThemedText>
          <ThemedText type="small" style={styles.tagline}>
            Your daily emotional vitamin
          </ThemedText>
          <ThemedText type="small" style={styles.version}>
            Version {version}
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="small" style={styles.cardText}>
            {appName} is about plugging stories into the world — into hearts, souls, bodies, and minds.
            Some are fiction, some are real stories submitted by our own readers, but every one carries a
            quote and a reflection meant to leave you a little better than it found you.
          </ThemedText>
        </ThemedView>

        <Link href="/privacy" asChild>
          <Pressable style={styles.linkRow}>
            <ThemedText type="small" style={styles.link}>
              Privacy Policy
            </ThemedText>
          </Pressable>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  centerBlock: { alignItems: 'center', gap: 4, marginTop: Spacing.four, marginBottom: Spacing.four },
  logo: { width: 80, height: 80, marginBottom: Spacing.two },
  appName: { fontSize: 22 },
  tagline: { opacity: 0.6 },
  version: { opacity: 0.45, marginTop: Spacing.one },
  card: { borderRadius: 12, padding: Spacing.three, marginBottom: Spacing.three },
  cardText: { opacity: 0.8, lineHeight: 20, textAlign: 'center' },
  linkRow: { alignItems: 'center', paddingVertical: Spacing.two },
  link: { color: '#C01918', fontWeight: '600' },
});
