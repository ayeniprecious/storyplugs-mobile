import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useJournal } from '@/hooks/use-journal';
import { useTheme } from '@/hooks/use-theme';
import type { JournalEntry } from '@/lib/database.types';

export default function Journal() {
  const theme = useTheme();
  const { entries, loading, updateEntry, deleteEntry } = useJournal();
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openEntry(entry: JournalEntry) {
    setEditing(entry);
    setDraft(entry.entry);
    setError(null);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const { error: saveError } = await updateEntry(editing.id, draft);
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    setEditing(null);
  }

  async function handleDelete() {
    if (!editing) return;
    setSaving(true);
    const { error: deleteError } = await deleteEntry(editing.id);
    setSaving(false);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    setEditing(null);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            My Journal
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.centerFill}>
            <ActivityIndicator color={theme.text} />
          </ThemedView>
        ) : entries.length === 0 ? (
          <ThemedView style={styles.centerFill}>
            <ThemedText type="small" style={styles.emptyText}>
              Your reflections will show up here once you save one from a story.
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable onPress={() => openEntry(item)}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="smallBold">{item.story_title}</ThemedText>
                  <ThemedText type="small" style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </ThemedText>
                  <ThemedText type="small" style={styles.cardPreview} numberOfLines={2}>
                    {item.entry}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditing(null)}>
          <ThemedView
            type="backgroundElement"
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
          >
            <ThemedText type="smallBold">{editing?.story_title}</ThemedText>
            <ThemedText type="small" style={styles.modalQuestion}>
              {editing?.reflection_question}
            </ThemedText>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholderTextColor={theme.placeholder}
              multiline
              textAlignVertical="top"
            />
            {error && (
              <ThemedText type="small" style={styles.errorText}>
                {error}
              </ThemedText>
            )}
            <ThemedView style={styles.modalActions}>
              <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={saving}>
                <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving || !draft.trim()}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                )}
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
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  emptyText: { textAlign: 'center', opacity: 0.6 },
  listContent: { gap: Spacing.two, paddingBottom: Spacing.six },
  card: { borderRadius: 12, padding: Spacing.three, gap: 4 },
  cardDate: { opacity: 0.5 },
  cardPreview: { opacity: 0.8, marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  modalQuestion: { opacity: 0.7 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 120,
  },
  errorText: { color: '#ff453a' },
  modalActions: { flexDirection: 'row', gap: Spacing.two, backgroundColor: 'transparent' },
  deleteButton: {
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#ff453a', fontWeight: '600' },
  saveButton: {
    flex: 1,
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});
