import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function BackButton({ href, label = 'Back' }: { href: Href; label?: string }) {
  // router.back() pops to the screen that's already mounted on the stack
  // underneath (preserving its state, no refetch). A plain <Link href> would
  // always push a brand-new instance instead, growing the stack forever and
  // re-running every effect on a screen the user had already opened.
  // replace() is only a fallback for a deep link with no history to pop.
  function handlePress() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(href);
    }
  }

  return (
    <Pressable style={styles.row} hitSlop={8} onPress={handlePress}>
      <Ionicons name="chevron-back" size={26} color="#C01918" />
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  label: { color: '#C01918', fontWeight: '600', fontSize: 17 },
});
