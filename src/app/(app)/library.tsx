import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { CATEGORY_LABELS } from '@/hooks/use-all-stories';
import { useCompletedStories } from '@/hooks/use-completed-stories';
import { useContinueReading } from '@/hooks/use-continue-reading';
import { useFavoritesList } from '@/hooks/use-favorites-list';
import type { Story } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function LibraryRow({
  story,
  subtitle,
  progressPercent,
  onRemove,
  removeLabel,
}: {
  story: Story;
  subtitle?: string;
  progressPercent?: number;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
        <Pressable style={styles.rowPressable}>
          {story.image_url && (
            <Image source={{ uri: story.image_url }} style={styles.thumb} contentFit="cover" />
          )}
          <ThemedView style={styles.rowBody}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {story.title}
            </ThemedText>
            <ThemedText type="small" style={styles.categoryLabel}>
              {CATEGORY_LABELS[story.category]}
            </ThemedText>
            {progressPercent !== undefined ? (
              <>
                <ThemedView style={styles.progressTrack}>
                  <ThemedView style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </ThemedView>
                <ThemedText type="small" style={styles.progressLabel}>
                  {progressPercent}% read
                </ThemedText>
              </>
            ) : subtitle ? (
              <ThemedText type="small" style={styles.progressLabel}>
                {subtitle}
              </ThemedText>
            ) : null}
          </ThemedView>
        </Pressable>
      </Link>
      <Pressable style={styles.removeButton} onPress={onRemove} accessibilityLabel={removeLabel}>
        <ThemedText style={styles.removeButtonText}>✕</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const COMPLETED_COLLAPSED_LIMIT = 5;

export default function Library() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const { items: continueItems, loading: continueLoading, refresh: refreshContinue } =
    useContinueReading();
  const { items: completedItems, loading: completedLoading, refresh: refreshCompleted } =
    useCompletedStories();
  const { stories: savedStories, loading: savedLoading, refresh: refreshSaved } = useFavoritesList();

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshContinue(), refreshCompleted(), refreshSaved()]);
  }, [refreshContinue, refreshCompleted, refreshSaved]);

  async function handlePullToRefresh() {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }

  async function removeFromContinueReading(storyId: string) {
    if (!user?.id) return;
    await supabase.from('story_views').delete().eq('user_id', user.id).eq('story_id', storyId);
    refreshContinue();
  }

  async function removeFromCompleted(storyId: string) {
    if (!user?.id) return;
    await supabase.from('story_views').delete().eq('user_id', user.id).eq('story_id', storyId);
    refreshCompleted();
  }

  async function removeFromSaved(storyId: string) {
    if (!user?.id) return;
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('story_id', storyId);
    refreshSaved();
  }

  const loading = continueLoading || completedLoading || savedLoading;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handlePullToRefresh} tintColor="#e50914" />
          }
        >
          <ThemedText type="title" style={styles.title}>
            My Library
          </ThemedText>

          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <>
              <ThemedView style={styles.statsRow}>
                <ThemedView style={styles.statCard}>
                  <ThemedText type="smallBold" style={styles.statNumber}>
                    {continueItems.length}
                  </ThemedText>
                  <ThemedText type="small" style={styles.statLabel}>
                    In Progress
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.statCard}>
                  <ThemedText type="smallBold" style={styles.statNumber}>
                    {completedItems.length}
                  </ThemedText>
                  <ThemedText type="small" style={styles.statLabel}>
                    Completed
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.statCard}>
                  <ThemedText type="smallBold" style={styles.statNumber}>
                    {savedStories.length}
                  </ThemedText>
                  <ThemedText type="small" style={styles.statLabel}>
                    Saved
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Continue Reading
              </ThemedText>
              {continueItems.length === 0 ? (
                <ThemedText type="small" style={styles.emptyHint}>
                  Stories you open but haven&apos;t finished will show up here.
                </ThemedText>
              ) : (
                continueItems.map(({ story, progressPercent }) => (
                  <LibraryRow
                    key={story.id}
                    story={story}
                    progressPercent={progressPercent}
                    onRemove={() => removeFromContinueReading(story.id)}
                    removeLabel="Remove from Continue Reading"
                  />
                ))
              )}

              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Saved
              </ThemedText>
              {savedStories.length === 0 ? (
                <ThemedText type="small" style={styles.emptyHint}>
                  Stories you save will show up here.
                </ThemedText>
              ) : (
                savedStories.map((story) => (
                  <LibraryRow
                    key={story.id}
                    story={story}
                    onRemove={() => removeFromSaved(story.id)}
                    removeLabel="Remove from Saved"
                  />
                ))
              )}

              <Pressable
                style={styles.collapsibleHeading}
                onPress={() => setCompletedExpanded((prev) => !prev)}
                disabled={completedItems.length <= COMPLETED_COLLAPSED_LIMIT}
              >
                <ThemedText type="smallBold" style={styles.sectionHeadingText}>
                  Completed
                </ThemedText>
                {completedItems.length > COMPLETED_COLLAPSED_LIMIT && (
                  <ThemedText type="small" style={styles.collapsibleToggle}>
                    {completedExpanded ? 'Show less ▲' : `Show all (${completedItems.length}) ▼`}
                  </ThemedText>
                )}
              </Pressable>
              {completedItems.length === 0 ? (
                <ThemedText type="small" style={styles.emptyHint}>
                  Stories you finish will show up here.
                </ThemedText>
              ) : (
                (completedExpanded ? completedItems : completedItems.slice(0, COMPLETED_COLLAPSED_LIMIT)).map(
                  ({ story, completedAt }) => (
                    <LibraryRow
                      key={story.id}
                      story={story}
                      subtitle={`Completed ${formatDate(completedAt)}`}
                      onRemove={() => removeFromCompleted(story.id)}
                      removeLabel="Remove from Completed"
                    />
                  )
                )
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six },
  title: { fontSize: 26, lineHeight: 32, marginBottom: Spacing.two },
  loader: { marginTop: Spacing.five },
  sectionHeading: { marginTop: Spacing.three, marginBottom: Spacing.two, opacity: 0.85 },
  collapsibleHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  sectionHeadingText: { opacity: 0.85 },
  collapsibleToggle: { color: '#e50914', fontWeight: '600' },
  emptyHint: { opacity: 0.6, marginBottom: Spacing.two },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  statNumber: { fontSize: 20 },
  statLabel: { opacity: 0.6, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: Spacing.two,
    overflow: 'hidden',
  },
  rowPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  rowBody: { flex: 1, gap: 4, backgroundColor: 'transparent' },
  categoryLabel: { opacity: 0.5 },
  progressTrack: { height: 4, backgroundColor: 'rgba(128,128,128,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#e50914' },
  progressLabel: { opacity: 0.6 },
  removeButton: { paddingHorizontal: Spacing.three, alignSelf: 'stretch', justifyContent: 'center' },
  removeButtonText: { opacity: 0.6, fontSize: 16 },
});
