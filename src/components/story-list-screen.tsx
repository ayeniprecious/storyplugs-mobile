import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface StoryListScreenProps {
  title: string;
  backHref: Href;
  loading: boolean;
  isEmpty: boolean;
  emptyHint: string;
  children: ReactNode;
}

// Shared shell for Library's Downloads/Saved/Completed list routes -- each
// route file just wires its own hook's data into StoryRowCard rows and
// passes them as children; this owns the header, loading skeleton, and
// empty state so that structure isn't tripled across three near-identical
// screens.
export function StoryListScreen({ title, backHref, loading, isEmpty, emptyHint, children }: StoryListScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href={backHref} />
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.list}>
            <Skeleton style={styles.skeletonRow} />
            <Skeleton style={styles.skeletonRow} />
            <Skeleton style={styles.skeletonRow} />
          </ThemedView>
        ) : isEmpty ? (
          <ThemedText type="small" style={styles.emptyHint}>
            {emptyHint}
          </ThemedText>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  title: { fontSize: 24, lineHeight: 30 },
  list: { paddingBottom: Spacing.six, gap: Spacing.two },
  skeletonRow: { height: 80, borderRadius: 12 },
  emptyHint: { opacity: 0.6 },
});
