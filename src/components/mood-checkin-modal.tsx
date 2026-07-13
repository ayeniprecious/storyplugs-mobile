import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOOD_OPTIONS } from '@/constants/mood-options';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useTheme } from '@/hooks/use-theme';

interface MoodCheckinModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (mood: string, categories: string[]) => void;
}

// Mirrors onboarding/personalize.tsx's chip-picker interaction (mood is the
// single-select "chip" pattern from that screen's step 0) rather than
// inventing a new one -- this is a daily check-in, not a takeover, so it's a
// bottom sheet instead of personalize's full-screen flow.
export function MoodCheckinModal({ visible, onClose, onSubmit }: MoodCheckinModalProps) {
  const { order: categoryOrder, labels: categoryLabels } = useCategories();
  const theme = useTheme();
  const [mood, setMood] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  function toggleCategory(slug: string) {
    setCategories((prev) => (prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]));
  }

  function reset() {
    setMood(null);
    setCategories([]);
  }

  function handleSubmit() {
    if (!mood) return;
    onSubmit(mood, categories);
    reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <ThemedView type="backgroundElement" style={styles.sheet} onStartShouldSetResponder={() => true}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <ThemedText type="title" style={styles.title}>
              How are you feeling today?
            </ThemedText>
            <ThemedText type="small" style={styles.subtitle}>
              We&apos;ll pick stories to match — and still mix in a few surprises.
            </ThemedText>

            <ThemedView style={styles.chipWrap}>
              {MOOD_OPTIONS.map((option) => {
                const selected = mood === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setMood(option.value)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Ionicons name={option.icon} size={15} color={selected ? '#fff' : theme.text} />
                    <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>

            <ThemedText type="smallBold" style={styles.sectionHeading}>
              What kind of stories? (optional)
            </ThemedText>
            <ThemedView style={styles.chipWrap}>
              {categoryOrder.map((slug) => {
                const selected = categories.includes(slug);
                return (
                  <Pressable
                    key={slug}
                    onPress={() => toggleCategory(slug)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                      {categoryLabels[slug] ?? slug}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>
          </ScrollView>

          <Pressable
            style={[styles.primaryButton, !mood && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={!mood}
          >
            <ThemedText style={styles.primaryButtonText}>Show My Picks</ThemedText>
          </Pressable>
          <Pressable onPress={handleClose}>
            <ThemedText type="small" style={styles.dismissText}>
              Not now
            </ThemedText>
          </Pressable>
        </ThemedView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    maxHeight: '85%',
    gap: Spacing.two,
  },
  scrollContent: { gap: Spacing.two, paddingBottom: Spacing.two },
  title: { fontSize: 22, lineHeight: 28 },
  subtitle: { opacity: 0.7, marginBottom: Spacing.two },
  sectionHeading: { marginTop: Spacing.three, opacity: 0.85 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, backgroundColor: 'transparent' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  chipSelected: { backgroundColor: '#C01918' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  primaryButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  // No opacity fade here, unlike primaryButtonDisabled -- "Not now" is always
  // tappable, so it shouldn't read as a disabled control the way a faded
  // Show My Picks does when no mood is picked yet.
  dismissText: { textAlign: 'center', fontWeight: '600', marginTop: Spacing.two, marginBottom: Spacing.one },
});
