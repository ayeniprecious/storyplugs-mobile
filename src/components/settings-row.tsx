import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SettingsRowProps {
  label: string;
  href?: Href;
  onPress?: () => void;
  right?: ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

export function SettingsRow({
  label,
  href,
  onPress,
  right,
  showChevron,
  isLast,
  destructive,
  disabled,
}: SettingsRowProps) {
  const theme = useTheme();

  const content = (
    <ThemedView
      style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
    >
      <ThemedText style={destructive ? styles.destructiveText : undefined}>{label}</ThemedText>
      <ThemedView style={styles.rightSlot}>
        {right}
        {showChevron && <Ionicons name="chevron-forward" size={16} color={theme.placeholder} />}
      </ThemedView>
    </ThemedView>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable disabled={disabled}>{content}</Pressable>
      </Link>
    );
  }
  if (onPress) {
    return (
      <Pressable onPress={onPress} disabled={disabled}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    backgroundColor: 'transparent',
  },
  rightSlot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: 'transparent' },
  destructiveText: { color: '#ff453a' },
});
