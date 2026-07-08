import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function BackButton({ href, label = 'Back' }: { href: Href; label?: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.row} hitSlop={8}>
        <Ionicons name="chevron-back" size={26} color="#C01918" />
        <ThemedText style={styles.label}>{label}</ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  label: { color: '#C01918', fontWeight: '600', fontSize: 17 },
});
