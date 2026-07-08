import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useFeedback } from '@/hooks/use-feedback';
import { useTheme } from '@/hooks/use-theme';

export default function Feedback() {
  const theme = useTheme();
  const { submitting, error, submitFeedback } = useFeedback();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const { error: submitError } = await submitFeedback(message);
    if (!submitError) {
      setMessage('');
      setSent(true);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Link href="/profile" asChild>
            <Pressable style={styles.backLinkCombined}>
              <Ionicons name="chevron-back" size={16} color="#700a0a" />
              <ThemedText type="link">Back</ThemedText>
            </Pressable>
          </Link>
          <ThemedText type="title" style={styles.title}>
            Feedback
          </ThemedText>
        </ThemedView>

        <ThemedText type="small" style={styles.subtitle}>
          Bug, idea, or just something on your mind — we read every message.
        </ThemedText>

        {sent ? (
          <ThemedView type="backgroundElement" style={styles.sentCard}>
            <Ionicons name="checkmark-circle" size={20} color="#32b45a" />
            <ThemedText type="smallBold">Thanks for the feedback!</ThemedText>
          </ThemedView>
        ) : (
          <>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us what's on your mind…"
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
            <Pressable
              style={[styles.submitButton, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              onPress={handleSubmit}
              disabled={submitting || !message.trim()}
            >
              {submitting ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <ThemedText style={styles.submitButtonText}>Send Feedback</ThemedText>
              )}
            </Pressable>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  backLinkCombined: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  title: { fontSize: 24, lineHeight: 30 },
  subtitle: { opacity: 0.6, marginBottom: Spacing.three },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 140,
    marginBottom: Spacing.two,
  },
  errorText: { color: '#ff453a', marginBottom: Spacing.two },
  submitButton: { borderRadius: 10, borderWidth: 1, paddingVertical: Spacing.two + 2, alignItems: 'center' },
  submitButtonText: { fontWeight: '600' },
  sentCard: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
