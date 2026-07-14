import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Skeleton } from '@/components/skeleton';
import { StoryRowCard } from '@/components/story-row-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAllStories } from '@/hooks/use-all-stories';
import { useFolderStories } from '@/hooks/use-folder-stories';
import { useStoryFolders } from '@/hooks/use-story-folders';
import { useTheme } from '@/hooks/use-theme';

// A folder's contents, plus a full-screen "Add Stories" picker (search +
// tap-to-toggle across every published story) -- the "room for adding
// multiple stories inside" the folders feature needed. Lives as a top-level
// route (mirrors category/[slug].tsx) rather than nested under the (app)
// tab group, since it's reached by pushing from Library, not a tab itself.
export default function FolderDetail() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const theme = useTheme();
  const { stories, loading, refresh, addStory, removeStory } = useFolderStories(id);
  const { deleteFolder } = useStoryFolders();
  const { byCategory } = useAllStories();
  const allStories = useMemo(() => Object.values(byCategory).flat(), [byCategory]);

  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const inFolderIds = useMemo(() => new Set(stories.map((item) => item.storyId)), [stories]);

  const pickerResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allStories;
    return allStories.filter((story) => story.title.toLowerCase().includes(q));
  }, [allStories, query]);

  async function handleDeleteFolder() {
    setConfirmingDelete(false);
    if (id) await deleteFolder(id);
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/library" />
          <ThemedView style={styles.headerRow}>
            <ThemedText type="title" numberOfLines={1} style={styles.title}>
              {name ?? 'Folder'}
            </ThemedText>
            <Pressable onPress={() => setConfirmingDelete(true)} hitSlop={8} accessibilityLabel="Delete folder">
              <Ionicons name="trash-outline" size={20} color="#C01918" />
            </Pressable>
          </ThemedView>
          <ThemedText type="small" style={styles.count}>
            {stories.length} {stories.length === 1 ? 'story' : 'stories'}
          </ThemedText>
        </ThemedView>

        <Pressable style={styles.addButton} onPress={() => setPicking(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <ThemedText style={styles.addButtonText}>Add Stories</ThemedText>
        </Pressable>

        {loading ? (
          <View>
            <Skeleton style={styles.skeletonRow} />
            <Skeleton style={styles.skeletonRow} />
          </View>
        ) : stories.length === 0 ? (
          <ThemedText type="small" style={styles.emptyHint}>
            No stories in this folder yet. Tap Add Stories to start filling it up.
          </ThemedText>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {stories.map(({ storyId, story }) => (
              <StoryRowCard
                key={storyId}
                story={story}
                onRemove={() => removeStory(storyId)}
                removeLabel="Remove from Folder"
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <ThemedView style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <ThemedView style={styles.pickerHeader}>
              <ThemedText type="title" style={styles.title}>
                Add Stories
              </ThemedText>
              <Pressable onPress={() => setPicking(false)} hitSlop={8}>
                <ThemedText style={styles.doneText}>Done</ThemedText>
              </Pressable>
            </ThemedView>
            <ThemedView style={[styles.searchWrap, { borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={18} color={theme.placeholder} style={styles.searchIcon} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search stories"
                placeholderTextColor={theme.placeholder}
                style={[styles.searchInput, { color: theme.text }]}
              />
            </ThemedView>
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {pickerResults.map((story) => {
                const added = inFolderIds.has(story.id);
                return (
                  <Pressable
                    key={story.id}
                    style={[styles.pickerRow, { borderBottomColor: theme.border }]}
                    onPress={() => (added ? removeStory(story.id) : addStory(story.id))}
                  >
                    <ThemedText numberOfLines={1} style={styles.pickerRowTitle}>
                      {story.title}
                    </ThemedText>
                    <Ionicons
                      name={added ? 'checkmark-circle' : 'add-circle-outline'}
                      size={22}
                      color={added ? '#C01918' : theme.placeholder}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>

      <Modal
        visible={confirmingDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingDelete(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmingDelete(false)}>
          <ThemedView type="backgroundElement" style={styles.confirmCard} onStartShouldSetResponder={() => true}>
            <ThemedText type="smallBold" style={styles.confirmTitle}>
              Delete this folder?
            </ThemedText>
            <ThemedText type="small" style={styles.confirmBody}>
              This removes the folder. Stories inside stay in your library.
            </ThemedText>
            <ThemedView style={styles.confirmActions}>
              <Pressable
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setConfirmingDelete(false)}
              >
                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={handleDeleteFolder}>
                <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  title: { fontSize: 24, lineHeight: 30, flexShrink: 1 },
  count: { opacity: 0.6 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    marginBottom: Spacing.three,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  emptyHint: { opacity: 0.6 },
  list: { paddingBottom: Spacing.six, gap: Spacing.two },
  skeletonRow: { height: 80, borderRadius: 12, marginBottom: Spacing.two },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  doneText: { color: '#C01918', fontWeight: '700', fontSize: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    backgroundColor: 'transparent',
  },
  searchIcon: { backgroundColor: 'transparent' },
  searchInput: { flex: 1, paddingVertical: Spacing.two + 4, fontSize: 16 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerRowTitle: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  confirmTitle: { fontSize: 17 },
  confirmBody: { opacity: 0.75, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two, backgroundColor: 'transparent' },
  cancelButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '600' },
  deleteButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#ff453a',
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#fff', fontWeight: '600' },
});
