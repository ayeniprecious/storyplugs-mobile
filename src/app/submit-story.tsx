import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useProfile } from '@/context/profile-context';
import { useSubmitStory } from '@/hooks/use-story-submissions';
import { useTheme } from '@/hooks/use-theme';

export default function SubmitStory() {
  const { profile } = useProfile();
  const theme = useTheme();
  const { order: categoryOrder, labels: categoryLabels } = useCategories();
  const { submit, submitting } = useSubmitStory();
  const isPremium = !!profile?.is_premium;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) {
      setError('Add a title and your story before submitting.');
      return;
    }
    setError(null);
    const { error: submitError } = await submit(title, body, category);
    if (submitError) {
      setError(submitError);
      return;
    }
    setSubmitted(true);
  }

  if (!isPremium) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.header}>
            <BackButton href="/library" />
            <ThemedText type="title" style={styles.title}>
              Submit a Story
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.messageCard}>
            <Ionicons name="create" size={32} color="#C01918" />
            <ThemedText type="smallBold" style={styles.messageTitle}>
              Share Your Own Story
            </ThemedText>
            <ThemedText type="small" style={styles.messageBody}>
              Submit a real story of your own for our team to review. If approved, it&apos;s
              published to Community Stories with your name on it. Premium unlocks submitting.
            </ThemedText>
            <Pressable style={styles.messageButton} onPress={() => router.push('/manage-subscription')}>
              <ThemedText style={styles.messageButtonText}>Unlock Premium</ThemedText>
            </Pressable>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (submitted) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedView style={styles.header}>
            <BackButton href="/library" />
            <ThemedText type="title" style={styles.title}>
              Submit a Story
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.messageCard}>
            <Ionicons name="checkmark-circle" size={32} color="#32b45a" />
            <ThemedText type="smallBold" style={styles.messageTitle}>
              Sent for review
            </ThemedText>
            <ThemedText type="small" style={styles.messageBody}>
              Our team will read it over. If it&apos;s approved, you&apos;ll find it in Community
              Stories with your name on it.
            </ThemedText>
            <Pressable style={styles.messageButton} onPress={() => router.replace('/library')}>
              <ThemedText style={styles.messageButtonText}>Back to Library</ThemedText>
            </Pressable>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/library" />
          <ThemedText type="title" style={styles.title}>
            Submit a Story
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="small" style={styles.hint}>
            Share a real story of your own. Our team reviews every submission before it appears
            in Community Stories.
          </ThemedText>

          <ThemedText type="small" style={styles.label}>
            Title
          </ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your story a title"
            placeholderTextColor={theme.placeholder}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />

          <ThemedText type="small" style={styles.label}>
            Category (optional)
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {categoryOrder.map((slug) => {
              const selected = category === slug;
              return (
                <Pressable
                  key={slug}
                  onPress={() => setCategory(selected ? null : slug)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                    {categoryLabels[slug] ?? slug}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <ThemedText type="small" style={styles.label}>
            Your story
          </ThemedText>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write your story here..."
            placeholderTextColor={theme.placeholder}
            style={[styles.input, styles.bodyInput, { borderColor: theme.border, color: theme.text }]}
            multiline
            textAlignVertical="top"
          />

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Submit for Review</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  scrollContent: { paddingBottom: Spacing.six, gap: Spacing.two },
  hint: { opacity: 0.7, marginBottom: Spacing.one, lineHeight: 19 },
  label: { opacity: 0.6, marginTop: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  bodyInput: { minHeight: 220, paddingTop: Spacing.two },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  chipSelected: { backgroundColor: '#C01918' },
  chipTextSelected: { color: '#fff' },
  error: { color: '#ff453a', fontSize: 13 },
  submitButton: {
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitButtonText: { color: '#fff', fontWeight: '700' },
  messageCard: {
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    backgroundColor: CardAsh,
  },
  messageTitle: { fontSize: 17, textAlign: 'center' },
  messageBody: { opacity: 0.7, textAlign: 'center', lineHeight: 20 },
  messageButton: {
    marginTop: Spacing.two,
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  messageButtonText: { color: '#fff', fontWeight: '700' },
});
