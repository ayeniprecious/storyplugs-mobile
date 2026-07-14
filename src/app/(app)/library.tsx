import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRow } from '@/components/category-row';
import { Skeleton } from '@/components/skeleton';
import { StoryRowCard } from '@/components/story-row-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import { useProfile } from '@/context/profile-context';
import { useAllStories } from '@/hooks/use-all-stories';
import { useCompletedStories } from '@/hooks/use-completed-stories';
import { useContinueReading } from '@/hooks/use-continue-reading';
import { useDownloads } from '@/hooks/use-downloads';
import { useFavoritesList } from '@/hooks/use-favorites-list';
import { buildRecommendations } from '@/lib/recommendations';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

// A section header that turns into a "Show all (N) / Show less" toggle once
// a list grows past the collapsed limit -- every list section on this page
// uses this, so a long history (lots of completed stories, a big saved list,
// etc.) never balloons the page's scroll height by default.
function SectionHeading({
  title,
  count,
  expanded,
  onToggle,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const needsToggle = count > COLLAPSED_LIMIT;
  return (
    <Pressable style={styles.collapsibleHeading} onPress={onToggle} disabled={!needsToggle}>
      <ThemedText type="smallBold" style={styles.sectionHeadingText}>
        {title}
      </ThemedText>
      {needsToggle && (
        <ThemedView style={styles.collapsibleToggleRow}>
          <ThemedText type="small" style={styles.collapsibleToggle}>
            {expanded ? 'Show less' : `Show all (${count})`}
          </ThemedText>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#C01918" />
        </ThemedView>
      )}
    </Pressable>
  );
}

const COLLAPSED_LIMIT = 5;

interface ExpandedSections {
  continueReading: boolean;
  downloads: boolean;
  saved: boolean;
  completed: boolean;
}

export default function Library() {
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedSections>({
    continueReading: false,
    downloads: false,
    saved: false,
    completed: false,
  });

  function toggleSection(key: keyof ExpandedSections) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
  const { profile } = useProfile();
  const { byCategory, refresh: refreshAllStories } = useAllStories();

  const recommended = useMemo(
    () => buildRecommendations(byCategory, profile?.interests, profile?.story_length_pref, undefined, 5),
    [byCategory, profile?.interests, profile?.story_length_pref]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshContinue(), refreshCompleted(), refreshSaved(), refreshDownloads(), refreshAllStories()]);
  }, [refreshContinue, refreshCompleted, refreshSaved, refreshDownloads, refreshAllStories]);

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

  // Each section tracks its own hook's loading state independently now
  // (rather than one shared flag for all of them) so, e.g., a slow Saved
  // fetch doesn't hold Continue Reading behind a skeleton too -- it also
  // happens to be what makes interleaving Downloads (a separate,
  // local-only/AsyncStorage loading state) between other network-backed
  // sections work cleanly.
  const statsLoading = continueLoading || completedLoading || savedLoading;

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

          {statsLoading ? (
            <ThemedView style={styles.statsRow}>
              <Skeleton style={styles.statCardSkeleton} />
              <Skeleton style={styles.statCardSkeleton} />
              <Skeleton style={styles.statCardSkeleton} />
            </ThemedView>
          ) : (
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
          )}

          <SectionHeading
            title="Continue Reading"
            count={continueItems.length}
            expanded={expanded.continueReading}
            onToggle={() => toggleSection('continueReading')}
          />
          {continueLoading ? (
            <>
              <LibraryRowSkeleton />
              <LibraryRowSkeleton />
            </>
          ) : continueItems.length === 0 ? (
            <ThemedText type="small" style={styles.emptyHint}>
              Stories you open but haven&apos;t finished will show up here.
            </ThemedText>
          ) : (
            (expanded.continueReading ? continueItems : continueItems.slice(0, COLLAPSED_LIMIT)).map(
              ({ story, progressPercent }) => (
                <StoryRowCard
                  key={story.id}
                  story={story}
                  progressPercent={progressPercent}
                  onRemove={() => removeFromContinueReading(story.id)}
                  removeLabel="Remove from Continue Reading"
                />
              )
            )
          )}

          <SectionHeading
            title="Downloads"
            count={downloads.length}
            expanded={expanded.downloads}
            onToggle={() => toggleSection('downloads')}
          />
          {downloadsLoading ? (
            <LibraryRowSkeleton withThirdLine={false} />
          ) : downloads.length === 0 ? (
            <ThemedText type="small" style={styles.emptyHint}>
              Stories you download for offline reading (Premium) will show up here.
            </ThemedText>
          ) : (
            (expanded.downloads ? downloads : downloads.slice(0, COLLAPSED_LIMIT)).map((story) => (
              <StoryRowCard
                key={story.id}
                story={story}
                subtitle="Downloaded"
                onRemove={() => removeDownload(story.id)}
                removeLabel="Remove download"
              />
            ))
          )}

          {recommended.length > 0 && (
            <ThemedView style={styles.recommendedSection}>
              <CategoryRow label="Recommended for You" stories={recommended} />
            </ThemedView>
          )}

          <SectionHeading
            title="Saved"
            count={savedStories.length}
            expanded={expanded.saved}
            onToggle={() => toggleSection('saved')}
          />
          {savedLoading ? (
            <LibraryRowSkeleton />
          ) : savedStories.length === 0 ? (
            <ThemedText type="small" style={styles.emptyHint}>
              Stories you save will show up here.
            </ThemedText>
          ) : (
            (expanded.saved ? savedStories : savedStories.slice(0, COLLAPSED_LIMIT)).map((story) => (
              <StoryRowCard
                key={story.id}
                story={story}
                onRemove={() => removeFromSaved(story.id)}
                removeLabel="Remove from Saved"
              />
            ))
          )}

          <SectionHeading
            title="Completed"
            count={completedItems.length}
            expanded={expanded.completed}
            onToggle={() => toggleSection('completed')}
          />
          {completedLoading ? (
            <LibraryRowSkeleton />
          ) : completedItems.length === 0 ? (
            <ThemedText type="small" style={styles.emptyHint}>
              Stories you finish will show up here.
            </ThemedText>
          ) : (
            (expanded.completed ? completedItems : completedItems.slice(0, COLLAPSED_LIMIT)).map(
              ({ story, completedAt }) => (
                <StoryRowCard
                  key={story.id}
                  story={story}
                  subtitle={`Completed ${formatDate(completedAt)}`}
                  onRemove={() => removeFromCompleted(story.id)}
                  removeLabel="Remove from Completed"
                />
              )
            )
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
  skeletonLineTitle: { width: '70%', height: 20, borderRadius: 4 },
  skeletonLineSubtitle: { width: '40%', height: 20, borderRadius: 4 },
  skeletonLineThird: { width: '55%', height: 20, borderRadius: 4 },
  recommendedSection: { marginTop: Spacing.three, marginBottom: Spacing.two },
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
    backgroundColor: CardAsh,
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
});
