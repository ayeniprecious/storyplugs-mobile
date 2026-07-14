import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRow } from '@/components/category-row';
import { CreateFolderModal } from '@/components/create-folder-modal';
import { FolderCard } from '@/components/folder-card';
import { Skeleton } from '@/components/skeleton';
import { SettingsGroup } from '@/components/settings-group';
import { SettingsRow } from '@/components/settings-row';
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
import { useStoryFolders } from '@/hooks/use-story-folders';
import { buildRecommendations } from '@/lib/recommendations';

function LibraryRowSkeleton() {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <ThemedView style={styles.rowPressable}>
        <Skeleton style={styles.thumb} />
        <ThemedView style={styles.rowBody}>
          <Skeleton style={styles.skeletonLineTitle} />
          <Skeleton style={styles.skeletonLineSubtitle} />
          <Skeleton style={styles.skeletonLineThird} />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const CONTINUE_CARD_WIDTH = 270;
const FOLDERS_COLLAPSED_LIMIT = 3;

export default function Library() {
  const [refreshing, setRefreshing] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(false);

  const {
    items: continueItems,
    loading: continueLoading,
    refresh: refreshContinue,
    removeItem: removeFromContinueReading,
  } = useContinueReading();
  const { items: completedItems, loading: completedLoading, refresh: refreshCompleted } = useCompletedStories();
  const { stories: savedStories, loading: savedLoading, refresh: refreshSaved } = useFavoritesList();
  const { downloads, loading: downloadsLoading, refresh: refreshDownloads } = useDownloads();
  const { profile } = useProfile();
  const { byCategory, refresh: refreshAllStories } = useAllStories();
  const { folders, loading: foldersLoading, refresh: refreshFolders, createFolder } = useStoryFolders();

  const recommended = useMemo(
    () => buildRecommendations(byCategory, profile?.interests, profile?.story_length_pref, undefined, 5),
    [byCategory, profile?.interests, profile?.story_length_pref]
  );

  // Chunked into pairs (a column of up to 2) rather than relying on
  // flexWrap on the ScrollView's contentContainerStyle -- react-native-web's
  // ScrollView doesn't reliably honor flexWrap for building a multi-row
  // horizontal grid the way native RN does, so this groups the data instead
  // and lets each pair-column size itself naturally.
  const continuePairs = useMemo(() => {
    const pairs: (typeof continueItems)[] = [];
    for (let i = 0; i < continueItems.length; i += 2) {
      pairs.push(continueItems.slice(i, i + 2));
    }
    return pairs;
  }, [continueItems]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshContinue(),
      refreshCompleted(),
      refreshSaved(),
      refreshDownloads(),
      refreshAllStories(),
      refreshFolders(),
    ]);
  }, [refreshContinue, refreshCompleted, refreshSaved, refreshDownloads, refreshAllStories, refreshFolders]);

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

          <ThemedText type="smallBold" style={styles.plainHeading}>
            Continue Reading
          </ThemedText>
          {continueLoading ? (
            <ThemedView style={styles.continueLoadingRow}>
              <View style={styles.continueColumn}>
                <LibraryRowSkeleton />
              </View>
              <View style={styles.continueColumn}>
                <LibraryRowSkeleton />
              </View>
            </ThemedView>
          ) : continueItems.length === 0 ? (
            <ThemedText type="small" style={styles.emptyHint}>
              Stories you open but haven&apos;t finished will show up here.
            </ThemedText>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.continueGrid}
            >
              {continuePairs.map((pair, i) => (
                <View key={i} style={styles.continueColumn}>
                  {pair.map(({ story, progressPercent }) => (
                    <StoryRowCard
                      key={story.id}
                      story={story}
                      progressPercent={progressPercent}
                      onRemove={() => removeFromContinueReading(story.id)}
                      removeLabel="Remove from Continue Reading"
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          )}

          <ThemedView style={styles.foldersHeadingRow}>
            <ThemedText type="smallBold" style={styles.sectionHeadingText}>
              My Folders
            </ThemedText>
            {folders.length > FOLDERS_COLLAPSED_LIMIT && (
              <Pressable
                style={styles.collapsibleToggleRow}
                onPress={() => setFoldersExpanded((prev) => !prev)}
              >
                <ThemedText type="small" style={styles.collapsibleToggle}>
                  {foldersExpanded ? 'Show less' : `Show all (${folders.length})`}
                </ThemedText>
                <Ionicons name={foldersExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#C01918" />
              </Pressable>
            )}
          </ThemedView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foldersRow}>
            <Pressable style={styles.newFolderTile} onPress={() => setCreatingFolder(true)}>
              <Ionicons name="add" size={26} color="#C01918" />
              <ThemedText type="small" style={styles.newFolderLabel}>
                New Folder
              </ThemedText>
            </Pressable>
            {foldersLoading ? (
              <>
                <Skeleton style={styles.folderSkeleton} />
                <Skeleton style={styles.folderSkeleton} />
              </>
            ) : (
              (foldersExpanded ? folders : folders.slice(0, FOLDERS_COLLAPSED_LIMIT)).map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onPress={() =>
                    router.push({ pathname: '/folder/[id]', params: { id: folder.id, name: folder.name } })
                  }
                />
              ))
            )}
          </ScrollView>

          {/* Downloads/Saved/Completed are full lists of their own now (see
              src/app/library/*.tsx) -- these are just entry points, not
              inline lists, so a long history in any of them no longer
              balloons this page's scroll height. Saved/Completed skip a
              counter since the stat cards above already show those counts;
              Downloads doesn't have a stat card, so it gets one here. */}
          <SettingsGroup>
            <SettingsRow
              label="Downloads"
              href="/library/downloads"
              showChevron
              right={
                <ThemedText type="small" style={styles.navCount}>
                  {downloadsLoading ? '' : downloads.length}
                </ThemedText>
              }
            />
            <SettingsRow label="Saved" href="/library/saved" showChevron />
            <SettingsRow label="Completed" href="/library/completed" showChevron isLast />
          </SettingsGroup>

          {recommended.length > 0 && (
            <ThemedView style={styles.recommendedSection}>
              <CategoryRow label="Recommended for You" stories={recommended} />
            </ThemedView>
          )}
        </ScrollView>
      </SafeAreaView>

      <CreateFolderModal
        visible={creatingFolder}
        onClose={() => setCreatingFolder(false)}
        onCreate={createFolder}
      />
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
  recommendedSection: { marginTop: Spacing.two, marginBottom: Spacing.two },
  // Continue Reading is an unbounded horizontal scroll (no "Show all"
  // toggle), so its heading is plain text. My Folders gets the toggle
  // treatment below once there are more than FOLDERS_COLLAPSED_LIMIT.
  plainHeading: { opacity: 0.85, marginTop: Spacing.three, marginBottom: Spacing.two },
  foldersHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    backgroundColor: 'transparent',
  },
  sectionHeadingText: { opacity: 0.85 },
  collapsibleToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent' },
  collapsibleToggle: { color: '#C01918', fontWeight: '600' },
  // continueItems is chunked into pairs (see continuePairs above); each pair
  // renders as its own 2-high column, and the columns themselves scroll
  // horizontally -- the flexWrap-on-ScrollView trick for this doesn't behave
  // reliably in react-native-web, so this groups the data instead.
  continueGrid: { flexDirection: 'row', gap: Spacing.two },
  continueLoadingRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: 'transparent' },
  continueColumn: { width: CONTINUE_CARD_WIDTH, gap: Spacing.two, backgroundColor: 'transparent' },
  foldersRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  folderSkeleton: { width: 132, height: 96, borderRadius: 12, marginRight: Spacing.two },
  newFolderTile: {
    width: 132,
    height: 96,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(192,25,24,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  newFolderLabel: { color: '#C01918', fontWeight: '600' },
  navCount: { opacity: 0.6 },
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
