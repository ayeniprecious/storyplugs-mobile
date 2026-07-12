import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useCompletedStories } from '@/hooks/use-completed-stories';
import { useContinueReading } from '@/hooks/use-continue-reading';
import { useDownloads } from '@/hooks/use-downloads';
import { useFavoritesList } from '@/hooks/use-favorites-list';
import type { Story } from '@/lib/database.types';

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
  const { labels: categoryLabels } = useCategories();
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
              {categoryLabels[story.category] ?? story.category}
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
        <Ionicons name="close" size={18} color="#8a8a8e" />
      </Pressable>
    </ThemedView>
  );
}

function LibraryRowSkeleton({ withThirdLine = true }: { withThirdLine?: boolean }) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <ThemedView style={styles.rowPressable}>
        <Skeleton style={styles.thumb} />
        <ThemedView style={styles.rowBody}>
          <Skeleton style={styles.skeletonLineTitle} />
          <Skeleton style={styles.skeletonLineSubtitle} />
          {withThirdLine && <Skeleton style={styles.skeletonLineThird} />}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const COMPLETED_COLLAPSED_LIMIT = 5;

export default function Library() {
  const [refreshing, setRefreshing] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const {
    items: continueItems,
    loading: continueLoading,
    refresh: refreshContinue,
    removeItem: removeFromContinueReading,
  } = useContinueReading();
  const {
    items: completedItems,
    loading: completedLoading,
    refresh: refreshCompleted,
    removeItem: removeFromCompleted,
  } = useCompletedStories();
  const {
    stories: savedStories,
    loading: savedLoading,
    refresh: refreshSaved,
    removeStory: removeFromSaved,
  } = useFavoritesList();
  const { downloads, loading: downloadsLoading, refresh: refreshDownloads, removeDownload } = useDownloads();

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshContinue(), refreshCompleted(), refreshSaved(), refreshDownloads()]);
  }, [refreshContinue, refreshCompleted, refreshSaved, refreshDownloads]);

  // Story progress can change on a pushed screen (mark complete, save/unsave)
  // while this tab stays mounted behind it — refetch whenever we regain focus
  // so returning here always shows current state, not what it was on mount.
  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll])
  );

  async function handlePullToRefresh() {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }

  // Downloads is local-only (AsyncStorage), so it's deliberately excluded from
  // this combined flag and rendered on its own below -- gating it behind the
  // other three network-dependent hooks would mean offline downloads stay
  // hidden behind a full-screen skeleton until those network calls time out.
  const loading = continueLoading || completedLoading || savedLoading;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handlePullToRefresh} tintColor="#C01918" />
          }
        >
          <ThemedText type="title" style={styles.title}>
            My Library
          </ThemedText>

          {downloadsLoading ? (
            <>
              <Skeleton style={styles.sectionHeadingSkeleton} />
              <LibraryRowSkeleton withThirdLine={false} />
            </>
          ) : (
            <>
              <ThemedText type="smallBold" style={styles.sectionHeading}>
                Downloads
              </ThemedText>
              {downloads.length === 0 ? (
                <ThemedText type="small" style={styles.emptyHint}>
                  Stories you download for offline reading (Premium) will show up here.
                </ThemedText>
              ) : (
                downloads.map((story) => (
                  <LibraryRow
                    key={story.id}
                    story={story}
                    subtitle="Downloaded"
                    onRemove={() => removeDownload(story.id)}
                    removeLabel="Remove download"
                  />
                ))
              )}
            </>
          )}

          {loading ? (
            <>
              <ThemedView style={styles.statsRow}>
                <Skeleton style={styles.statCardSkeleton} />
                <Skeleton style={styles.statCardSkeleton} />
                <Skeleton style={styles.statCardSkeleton} />
              </ThemedView>
              <Skeleton style={styles.sectionHeadingSkeleton} />
              <LibraryRowSkeleton />
              <LibraryRowSkeleton />
              <Skeleton style={styles.sectionHeadingSkeleton} />
              <LibraryRowSkeleton withThirdLine={false} />
              <Skeleton style={styles.sectionHeadingSkeleton} />
              <LibraryRowSkeleton />
            </>
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
                  <ThemedView style={styles.collapsibleToggleRow}>
                    <ThemedText type="small" style={styles.collapsibleToggle}>
                      {completedExpanded ? 'Show less' : `Show all (${completedItems.length})`}
                    </ThemedText>
                    <Ionicons
                      name={completedExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#C01918"
                    />
                  </ThemedView>
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
  scrollContent: {
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  title: { fontSize: 24, lineHeight: 30, marginBottom: Spacing.two },
  statCardSkeleton: { flex: 1, height: 74, borderRadius: 12 },
  sectionHeadingSkeleton: { width: 140, height: 20, borderRadius: 4, marginTop: Spacing.three, marginBottom: Spacing.two },
  skeletonLineTitle: { width: '70%', height: 20, borderRadius: 4 },
  skeletonLineSubtitle: { width: '40%', height: 20, borderRadius: 4 },
  skeletonLineThird: { width: '55%', height: 20, borderRadius: 4 },
  sectionHeading: { marginTop: Spacing.three, marginBottom: Spacing.two, opacity: 0.85 },
  collapsibleHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  sectionHeadingText: { opacity: 0.85 },
  collapsibleToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  collapsibleToggle: { color: '#C01918', fontWeight: '600' },
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
  progressFill: { height: 4, backgroundColor: '#C01918' },
  progressLabel: { opacity: 0.6 },
  removeButton: { paddingHorizontal: Spacing.three, alignSelf: 'stretch', justifyContent: 'center' },
});
