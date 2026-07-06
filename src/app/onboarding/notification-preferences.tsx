import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CONTENT_TYPE_OPTIONS as CONTENT_TYPES, TIME_SLOT_OPTIONS as TIME_SLOTS } from '@/constants/notification-options';
import { useProfile } from '@/context/profile-context';
import type { NotificationContentType } from '@/lib/database.types';

export default function NotificationPreferences() {
  const { saveNotificationPreferences } = useProfile();
  const [selectedTypes, setSelectedTypes] = useState<NotificationContentType[]>([]);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleType(value: NotificationContentType) {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleContinue() {
    if (selectedTypes.length === 0) {
      setError('Pick at least one to continue.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: saveError } = await saveNotificationPreferences(selectedTypes, selectedTime);
    setSubmitting(false);
    if (saveError) setError(saveError);
    // On success, profile refreshes and the root layout's guard routes to (app) automatically.
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.title}>
            Your daily vitamin
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            We&apos;ll send you a gentle nudge once a day — pick what you want to hear about and when.
            You can change this anytime in Settings.
          </ThemedText>

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            What would you like to receive?
          </ThemedText>
          {CONTENT_TYPES.map((type) => {
            const selected = selectedTypes.includes(type.value);
            return (
              <Pressable
                key={type.value}
                onPress={() => toggleType(type.value)}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
              >
                <ThemedView
                  type="backgroundElement"
                  style={[styles.checkbox, selected && styles.checkboxSelected]}
                >
                  {selected && <ThemedText style={styles.checkboxMark}>✓</ThemedText>}
                </ThemedView>
                <ThemedView style={styles.optionTextGroup}>
                  <ThemedText type="smallBold">{type.label}</ThemedText>
                  <ThemedText type="small" style={styles.optionBlurb}>
                    {type.blurb}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            When should we send it?
          </ThemedText>
          <ThemedView style={styles.timeRow}>
            {TIME_SLOTS.map((slot) => {
              const selected = selectedTime === slot.value;
              return (
                <Pressable
                  key={slot.value}
                  onPress={() => setSelectedTime(slot.value)}
                  style={[styles.timeChip, selected && styles.timeChipSelected]}
                >
                  <ThemedText
                    type="small"
                    style={selected ? styles.timeChipTextSelected : undefined}
                  >
                    {slot.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          {error && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Pressable style={styles.primaryButton} onPress={handleContinue} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Continue</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: Spacing.four, gap: Spacing.two },
  title: { fontSize: 28, lineHeight: 34, marginBottom: Spacing.two },
  subtitle: { opacity: 0.75, marginBottom: Spacing.three },
  sectionLabel: { marginTop: Spacing.three, marginBottom: Spacing.two },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    marginBottom: Spacing.two,
  },
  optionCardSelected: { borderColor: '#e50914' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#e50914' },
  checkboxMark: { color: '#fff', fontWeight: '700' },
  optionTextGroup: { flex: 1, gap: 2 },
  optionBlurb: { opacity: 0.6 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  timeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  timeChipSelected: { backgroundColor: '#e50914', borderColor: '#e50914' },
  timeChipTextSelected: { color: '#fff', fontWeight: '700' },
  error: { color: '#ff453a', marginTop: Spacing.two },
  primaryButton: {
    backgroundColor: '#e50914',
    borderRadius: 10,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
