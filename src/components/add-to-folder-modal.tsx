import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import { useStoryFolderMembership } from '@/hooks/use-story-folder-membership';
import { useStoryFolders } from '@/hooks/use-story-folders';
import { useTheme } from '@/hooks/use-theme';

interface AddToFolderModalProps {
  visible: boolean;
  onClose: () => void;
  storyId: string;
}

// Full-screen "add to playlist" style picker (Spotify's own is the direct
// reference), reskinned in the app's own colors rather than copied wholesale
// -- red is kept to just the Done button and the small selected-checkbox
// fill, not tinting whole rows or badges, so it reads as an accent rather
// than the dominant color of the screen. "New Folder" swaps this same
// screen's content to an inline name form rather than stacking a second
// <Modal> on top of this one -- simultaneous/nested RN Modals are unreliable
// across platforms (a second one can fail to receive touches on native even
// when it happens to work in a web preview).
export function AddToFolderModal({ visible, onClose, storyId }: AddToFolderModalProps) {
  const theme = useTheme();
  const { folders, loading: foldersLoading, createFolder } = useStoryFolders();
  const { folderIds, loading: membershipLoading, toggleFolder } = useStoryFolderMembership(storyId);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const filteredFolders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((folder) => folder.name.toLowerCase().includes(q));
  }, [folders, query]);

  function handleClose() {
    setCreating(false);
    setNewName('');
    setQuery('');
    onClose();
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    const folder = await createFolder(newName.trim());
    if (folder) await toggleFolder(folder.id);
    setSaving(false);
    setNewName('');
    setCreating(false);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          {creating ? (
            <>
              <ThemedView style={styles.header}>
                <Pressable onPress={() => setCreating(false)} hitSlop={8}>
                  <ThemedText style={styles.headerAction}>Cancel</ThemedText>
                </Pressable>
                <ThemedText type="smallBold" style={styles.headerTitle} numberOfLines={1}>
                  New Folder
                </ThemedText>
                <ThemedView style={styles.headerSpacer} />
              </ThemedView>

              <ThemedView style={styles.createBody}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Folder name"
                  placeholderTextColor={theme.placeholder}
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  autoFocus
                  maxLength={40}
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                />
              </ThemedView>

              <ThemedView style={styles.bottomBar}>
                <Pressable
                  style={[styles.doneButton, !newName.trim() && styles.doneButtonDisabled]}
                  onPress={handleCreate}
                  disabled={saving || !newName.trim()}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.doneButtonText}>Create</ThemedText>
                  )}
                </Pressable>
              </ThemedView>
            </>
          ) : (
            <>
              <ThemedView style={styles.header}>
                <Pressable onPress={handleClose} hitSlop={8}>
                  <ThemedText style={styles.headerAction}>Cancel</ThemedText>
                </Pressable>
                <ThemedText type="smallBold" style={styles.headerTitle} numberOfLines={1}>
                  Add to Folder
                </ThemedText>
                <ThemedView style={styles.headerSpacer} />
              </ThemedView>

              <Pressable style={styles.newFolderPill} onPress={() => setCreating(true)}>
                <ThemedText style={styles.newFolderPillText}>New Folder</ThemedText>
              </Pressable>

              <ThemedView style={[styles.searchWrap, { borderColor: theme.border }]}>
                <Ionicons name="search" size={16} color={theme.placeholder} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Find folder"
                  placeholderTextColor={theme.placeholder}
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </ThemedView>

              {foldersLoading || membershipLoading ? (
                <ActivityIndicator color={theme.text} style={styles.loading} />
              ) : (
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                  {folders.length === 0 ? (
                    <ThemedText type="small" style={styles.emptyHint}>
                      Create your first folder above to start organizing stories.
                    </ThemedText>
                  ) : filteredFolders.length === 0 ? (
                    <ThemedText type="small" style={styles.emptyHint}>
                      No folders match &ldquo;{query}&rdquo;.
                    </ThemedText>
                  ) : (
                    filteredFolders.map((folder) => {
                      const inFolder = folderIds.has(folder.id);
                      const coverUrl = folder.coverStories[0]?.image_url;
                      return (
                        <Pressable key={folder.id} style={styles.row} onPress={() => toggleFolder(folder.id)}>
                          {coverUrl ? (
                            <Image source={{ uri: coverUrl }} style={styles.rowThumb} contentFit="cover" />
                          ) : (
                            <ThemedView style={styles.rowThumbPlaceholder}>
                              <Ionicons name="folder" size={20} color={theme.placeholder} />
                            </ThemedView>
                          )}
                          <ThemedView style={styles.rowBody}>
                            <ThemedText style={styles.rowText} numberOfLines={1}>
                              {folder.name}
                            </ThemedText>
                            <ThemedText type="small" style={styles.rowSubtext}>
                              {folder.itemCount} {folder.itemCount === 1 ? 'story' : 'stories'}
                            </ThemedText>
                          </ThemedView>
                          <ThemedView style={[styles.checkCircle, inFolder && styles.checkCircleActive]}>
                            {inFolder && <Ionicons name="checkmark" size={14} color="#fff" />}
                          </ThemedView>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              )}

              <ThemedView style={styles.bottomBar}>
                <Pressable style={styles.doneButton} onPress={handleClose}>
                  <ThemedText style={styles.doneButtonText}>Done</ThemedText>
                </Pressable>
              </ThemedView>
            </>
          )}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    backgroundColor: 'transparent',
  },
  headerAction: { color: '#C01918', fontWeight: '600', fontSize: 15, width: 60 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16 },
  headerSpacer: { width: 60, backgroundColor: 'transparent' },
  newFolderPill: {
    alignSelf: 'center',
    backgroundColor: CardAsh,
    borderRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    marginBottom: Spacing.three,
  },
  newFolderPillText: { fontWeight: '700', fontSize: 15 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    backgroundColor: 'transparent',
  },
  searchInput: { flex: 1, paddingVertical: Spacing.two + 2, fontSize: 15 },
  loading: { marginVertical: Spacing.four },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.one },
  emptyHint: { opacity: 0.6, textAlign: 'center', paddingVertical: Spacing.four },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingVertical: Spacing.two,
  },
  rowThumb: { width: 48, height: 48, borderRadius: 8 },
  rowThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CardAsh,
  },
  rowBody: { flex: 1, gap: 2, backgroundColor: 'transparent' },
  rowText: { fontSize: 15, fontWeight: '600' },
  rowSubtext: { opacity: 0.6 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(128,128,128,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: '#C01918', borderColor: '#C01918' },
  bottomBar: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    backgroundColor: 'transparent',
  },
  doneButton: {
    backgroundColor: '#700a0a',
    borderRadius: 24,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  doneButtonDisabled: { opacity: 0.4 },
  doneButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  createBody: { flex: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
});
