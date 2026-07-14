import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';

import { CreateFolderModal } from '@/components/create-folder-modal';
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

// A standalone centered dialog (same pattern as StoryRowCard's actions menu)
// listing every folder the user owns, each as its own ash-toned card with a
// folder-icon badge and a checkmark circle -- tapping a row toggles
// membership immediately, no separate "Save" step. A dashed "New Folder"
// button at the bottom (matching Library's own "New Folder" tile) creates
// one and adds the story to it in the same motion.
export function AddToFolderModal({ visible, onClose, storyId }: AddToFolderModalProps) {
  const theme = useTheme();
  const { folders, loading: foldersLoading, createFolder } = useStoryFolders();
  const { folderIds, loading: membershipLoading, toggleFolder } = useStoryFolderMembership(storyId);
  const [creatingFolder, setCreatingFolder] = useState(false);

  async function handleCreate(name: string) {
    const folder = await createFolder(name);
    if (folder) await toggleFolder(folder.id);
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <ThemedView type="cardAshSolid" style={styles.sheet} onStartShouldSetResponder={() => true}>
            <ThemedView style={styles.header}>
              <ThemedView style={styles.headerIconBadge}>
                <Ionicons name="folder-open" size={18} color="#C01918" />
              </ThemedView>
              <ThemedView style={styles.headerTextGroup}>
                <ThemedText type="smallBold" style={styles.title}>
                  Add to Folder
                </ThemedText>
                <ThemedText type="small" style={styles.subtitle}>
                  {folders.length === 0 ? 'No folders yet' : `${folders.length} folder${folders.length === 1 ? '' : 's'}`}
                </ThemedText>
              </ThemedView>
              <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
                <Ionicons name="close-circle" size={24} color={theme.placeholder} />
              </Pressable>
            </ThemedView>

            {foldersLoading || membershipLoading ? (
              <ActivityIndicator color={theme.text} style={styles.loading} />
            ) : (
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {folders.length === 0 ? (
                  <ThemedText type="small" style={styles.emptyHint}>
                    Create your first folder below to start organizing stories.
                  </ThemedText>
                ) : (
                  folders.map((folder) => {
                    const inFolder = folderIds.has(folder.id);
                    return (
                      <Pressable
                        key={folder.id}
                        style={[styles.row, inFolder && styles.rowActive]}
                        onPress={() => toggleFolder(folder.id)}
                      >
                        <ThemedView style={[styles.rowIconBadge, inFolder && styles.rowIconBadgeActive]}>
                          <Ionicons name="folder" size={16} color={inFolder ? '#fff' : '#C01918'} />
                        </ThemedView>
                        <ThemedText style={styles.rowText} numberOfLines={1}>
                          {folder.name}
                        </ThemedText>
                        <ThemedView style={[styles.checkCircle, inFolder && styles.checkCircleActive]}>
                          {inFolder && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </ThemedView>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}

            <Pressable style={styles.newFolderButton} onPress={() => setCreatingFolder(true)}>
              <Ionicons name="add" size={18} color="#C01918" />
              <ThemedText style={styles.newFolderText}>New Folder</ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Modal>

      <CreateFolderModal visible={creatingFolder} onClose={() => setCreatingFolder(false)} onCreate={handleCreate} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '78%',
    borderRadius: 20,
    padding: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    backgroundColor: 'transparent',
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(192,25,24,0.15)',
  },
  headerTextGroup: { flex: 1, gap: 1, backgroundColor: 'transparent' },
  title: { fontSize: 17 },
  subtitle: { opacity: 0.6 },
  loading: { marginVertical: Spacing.four },
  list: { flexGrow: 0 },
  emptyHint: { opacity: 0.6, paddingVertical: Spacing.three, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    borderRadius: 12,
    padding: Spacing.two + 2,
    marginBottom: Spacing.one + 2,
    backgroundColor: CardAsh,
  },
  rowActive: { backgroundColor: 'rgba(192,25,24,0.14)' },
  rowIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(192,25,24,0.15)',
  },
  rowIconBadgeActive: { backgroundColor: '#C01918' },
  rowText: { fontSize: 15, flex: 1, fontWeight: '600' },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(128,128,128,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: '#C01918', borderColor: '#C01918' },
  newFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(192,25,24,0.5)',
    paddingVertical: Spacing.two + 2,
    marginTop: Spacing.two,
  },
  newFolderText: { color: '#C01918', fontWeight: '700', fontSize: 15 },
});
