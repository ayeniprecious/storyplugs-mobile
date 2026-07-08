import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/hooks/use-theme';

export default function Privacy() {
  const theme = useTheme();
  const { settings, loading } = useAppSettings();
  const { profile, setHideIdentityInComments } = useProfile();
  const [updating, setUpdating] = useState(false);

  const hideIdentity = profile?.hide_identity_in_comments ?? false;

  async function handleToggle(value: boolean) {
    setUpdating(true);
    await setHideIdentityInComments(value);
    setUpdating(false);
  }

  const policyText = settings.privacy_policy?.trim();

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
            Privacy
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.toggleRow}>
          <ThemedView style={styles.toggleTextGroup}>
            <ThemedText type="smallBold">Hide my identity in comments</ThemedText>
            <ThemedText type="small" style={styles.toggleHint}>
              New comments you post will show as "Anonymous" instead of your name and photo.
            </ThemedText>
          </ThemedView>
          <Switch
            value={hideIdentity}
            onValueChange={handleToggle}
            disabled={updating}
            trackColor={{ false: theme.border, true: theme.backgroundSelected }}
            thumbColor={theme.text}
          />
        </ThemedView>

        <ThemedText type="smallBold" style={styles.sectionHeading}>
          Privacy Policy
        </ThemedText>
        {loading ? (
          <ThemedText type="small" style={styles.emptyHint}>
            Loading…
          </ThemedText>
        ) : policyText ? (
          <ThemedText type="small" style={styles.policyText}>
            {policyText}
          </ThemedText>
        ) : (
          <ThemedText type="small" style={styles.emptyHint}>
            No privacy policy has been published yet.
          </ThemedText>
        )}
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  toggleTextGroup: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  toggleHint: { opacity: 0.6, lineHeight: 18 },
  sectionHeading: { marginTop: Spacing.three, marginBottom: Spacing.two, opacity: 0.85 },
  policyText: { opacity: 0.75, lineHeight: 20 },
  emptyHint: { opacity: 0.6 },
});
