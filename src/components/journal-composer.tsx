import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';

import { PremiumLockModal } from '@/components/premium-lock-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/context/profile-context';
import { useJournal } from '@/hooks/use-journal';
import { useTheme } from '@/hooks/use-theme';

interface JournalComposerProps {
  storyId: string;
  storyTitle: string;
  reflectionQuestion: string;
}

export function JournalComposer({ storyId, storyTitle, reflectionQuestion }: JournalComposerProps) {
  const { profile } = useProfile();
  const theme = useTheme();
  const { saveEntry } = useJournal();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLock, setShowLock] = useState(false);

  if (!profile?.is_premium) {
    return (
      <>
        <Pressable style={styles.lockedRow} onPress={() => setShowLock(true)}>
          <Ionicons name="lock-closed-outline" size={16} color={theme.placeholder} />
          <ThemedText type="small" style={styles.lockedText}>
            Journal your reflection — Premium feature
          </ThemedText>
        </Pressable>
        <PremiumLockModal
          visible={showLock}
          onClose={() => setShowLock(false)}
          title="Journal is a premium feature"
          body="Write and revisit your own reflections on every story. Upgrade to start journaling."
        />
      </>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: saveError } = await saveEntry({ storyId, storyTitle, reflectionQuestion, entry: text });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    setText('');
    setSaved(true);
  }

  if (saved) {
    return (
      <ThemedView type="backgroundElement" style={styles.savedCard}>
        <ThemedText type="small">Saved to your Journal.</ThemedText>
        <Pressable onPress={() => setSaved(false)}>
          <ThemedText type="small" style={styles.writeAnotherText}>
            Write another
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.composer}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Write your reflection…"
        placeholderTextColor={theme.placeholder}
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        multiline
        textAlignVertical="top"
      />
      {error && (
        <ThemedText type="small" style={styles.errorText}>
          {error}
        </ThemedText>
      )}
      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving || !text.trim()}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.saveButtonText}>Save to Journal</ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  lockedText: { opacity: 0.7 },
  composer: { gap: Spacing.two, backgroundColor: 'transparent' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 100,
  },
  errorText: { color: '#ff453a' },
  saveButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  savedCard: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: 4,
  },
  writeAnotherText: { color: '#3c87f7', fontWeight: '600' },
});
