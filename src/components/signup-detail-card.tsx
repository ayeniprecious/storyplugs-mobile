import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import type { SignupNotificationMetadata } from '@/lib/database.types';

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function initialsFor(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

// The rich attachment a "New signup" admin notification renders instead of
// its plain body text -- same slot RankedPosterRow occupies for multi-story
// notifications. Purely informational (no actions): Premium is still granted
// by hand from Admin -> Users, this just saves a trip to look the user up.
export function SignupDetailCard({ metadata }: { metadata: SignupNotificationMetadata }) {
  const name = metadata.display_name || 'A new user';
  const age = metadata.date_of_birth ? calculateAge(metadata.date_of_birth) : null;

  return (
    <ThemedView style={styles.card}>
      <ThemedView style={styles.avatar}>
        <ThemedText style={styles.avatarText}>{initialsFor(metadata.display_name, metadata.email)}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.details}>
        <ThemedView style={styles.nameLine}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
            {name}
          </ThemedText>
          {age !== null && (
            <ThemedView style={styles.ageBadge}>
              <ThemedText style={styles.ageBadgeText}>{age}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        {metadata.email && (
          <ThemedText type="small" style={styles.email} numberOfLines={1}>
            {metadata.email}
          </ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: CardAsh,
    borderRadius: 10,
    padding: Spacing.two + 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(192,25,24,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ff6b68', fontSize: 15, fontWeight: '700' },
  details: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
  name: { flexShrink: 1 },
  email: { opacity: 0.7 },
  ageBadge: {
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  ageBadgeText: { fontSize: 11, fontWeight: '600', opacity: 0.85 },
});
