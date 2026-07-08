import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          <Link href="/profile" asChild>
            <Pressable style={styles.backLinkCombined}>
              <Ionicons name="chevron-back" size={16} color="#700a0a" />
              <ThemedText type="link">Back</ThemedText>
            </Pressable>
          </Link>
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
            A true story, quote, and reflection every day — real moments of hope, kindness, and faith,
            delivered gently at the time you choose.
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
  backLinkCombined: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  title: { fontSize: 24, lineHeight: 30 },
  centerBlock: { alignItems: 'center', gap: 4, marginTop: Spacing.four, marginBottom: Spacing.four },
  logo: { width: 80, height: 80, marginBottom: Spacing.two },
  appName: { fontSize: 22 },
  tagline: { opacity: 0.6 },
  version: { opacity: 0.45, marginTop: Spacing.one },
  card: { borderRadius: 12, padding: Spacing.three, marginBottom: Spacing.three },
  cardText: { opacity: 0.8, lineHeight: 20, textAlign: 'center' },
  linkRow: { alignItems: 'center', paddingVertical: Spacing.two },
  link: { color: '#700a0a', fontWeight: '600' },
});
