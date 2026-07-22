import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<unknown>;
}

// A modal sheet, not a CardAsh surface -- CardAsh is a translucent overlay
// meant to composite over the app's own opaque background, so it reads as
// muddy/inconsistent floating over this modal's semi-transparent backdrop.
// Same reasoning as every other modal card in the app (journal's entry
// editor, the mood check-in sheet, StoryRowCard's action sheet): those all
// use the opaque backgroundElement type instead.
export function CreateFolderModal({ visible, onClose, onCreate }: CreateFolderModalProps) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  function handleClose() {
    setName('');
    onClose();
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    await onCreate(name.trim());
    setSaving(false);
    setName('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <ThemedView type="backgroundElement" style={styles.card} onStartShouldSetResponder={() => true}>
          <ThemedText type="smallBold" style={styles.title}>
            New Folder
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Folder name"
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            autoFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <ThemedView style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={handleClose}>
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.createButton, !name.trim() && styles.createButtonDisabled]}
              onPress={handleCreate}
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.createText}>Create</ThemedText>
              )}
            </Pressable>
          </ThemedView>
        </ThemedView>
      </Pressable>
    </Modal>
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
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: { fontSize: 17 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one, backgroundColor: 'transparent' },
  cancelButton: { flex: 1, borderRadius: 10, paddingVertical: Spacing.two, alignItems: 'center' },
  cancelText: { opacity: 0.6, fontWeight: '600' },
  createButton: {
    flex: 1,
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  createButtonDisabled: { opacity: 0.4 },
  createText: { color: '#fff', fontWeight: '600' },
});
