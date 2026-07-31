import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ENABLE_COMMENTS } from '@/constants/launch-flags';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/hooks/use-theme';

const PRIVACY_POLICY_URL = 'https://storyplugs.com/privacy';

export default function Privacy() {
  const theme = useTheme();
  const { profile, setHideIdentityInComments } = useProfile();
  const [updating, setUpdating] = useState(false);

  const hideIdentity = profile?.hide_identity_in_comments ?? false;

  async function handleToggle(value: boolean) {
    setUpdating(true);
    await setHideIdentityInComments(value);
    setUpdating(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            Privacy
          </ThemedText>
        </ThemedView>

        {ENABLE_COMMENTS && (
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
        )}

        <ThemedText type="smallBold" style={styles.sectionHeading}>
          Privacy Policy
        </ThemedText>
        <Pressable
          style={[styles.policyLinkRow, { borderColor: theme.border }]}
          onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
        >
          <ThemedText type="small" style={styles.policyLinkText}>
            View our full Privacy Policy
          </ThemedText>
          <Ionicons name="open-outline" size={16} color={theme.placeholder} />
        </Pressable>
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
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  toggleTextGroup: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  toggleHint: { opacity: 0.6, lineHeight: 18 },
  sectionHeading: { marginTop: Spacing.three, marginBottom: Spacing.two, opacity: 0.85 },
  policyLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
  },
  policyLinkText: { fontWeight: '600' },
});
