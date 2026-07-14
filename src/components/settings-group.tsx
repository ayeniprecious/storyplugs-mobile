import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';

export function SettingsGroup({ children }: { children: ReactNode }) {
  return <ThemedView style={styles.group}>{children}</ThemedView>;
}

const styles = StyleSheet.create({
  group: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.three,
    backgroundColor: CardAsh,
  },
});
