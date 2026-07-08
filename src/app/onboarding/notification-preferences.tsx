import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <LinearGradient colors={['#2a070b', '#000000']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {router.canGoBack() && (
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.6)" />
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>
          </View>
        )}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Your daily vitamin</Text>
          <Text style={styles.subtitle}>
            We&apos;ll send you a gentle nudge once a day — pick what you want to hear about and when.
            You can change this anytime in Settings.
          </Text>

          <Text style={styles.sectionLabel}>What would you like to receive?</Text>
          {CONTENT_TYPES.map((type) => {
            const selected = selectedTypes.includes(type.value);
            return (
              <Pressable
                key={type.value}
                onPress={() => toggleType(type.value)}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <View style={styles.optionTextGroup}>
                  <Text style={styles.optionLabel}>{type.label}</Text>
                  <Text style={styles.optionBlurb}>{type.blurb}</Text>
                </View>
              </Pressable>
            );
          })}

          <Text style={styles.sectionLabel}>When should we send it?</Text>
          <View style={styles.timeRow}>
            {TIME_SLOTS.map((slot) => {
              const selected = selectedTime === slot.value;
              return (
                <Pressable
                  key={slot.value}
                  onPress={() => setSelectedTime(slot.value)}
                  style={[styles.timeChip, selected && styles.timeChipSelected]}
                >
                  <Text style={selected ? styles.timeChipTextSelected : styles.timeChipText}>
                    {slot.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.primaryButton} onPress={handleContinue} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Continue</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.two + 4, paddingVertical: Spacing.three, gap: Spacing.two },
  footer: { paddingHorizontal: Spacing.two + 4, paddingBottom: Spacing.three, gap: Spacing.two },
  title: { color: '#fff', fontSize: 24, lineHeight: 30, marginBottom: Spacing.two, fontWeight: '600' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: Spacing.three },
  sectionLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
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
  optionCardSelected: { borderColor: '#700a0a' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  checkboxSelected: { backgroundColor: '#700a0a' },
  optionTextGroup: { flex: 1, gap: 2 },
  optionLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  optionBlurb: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  timeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  timeChipText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  timeChipSelected: { backgroundColor: '#700a0a', borderColor: '#700a0a' },
  timeChipTextSelected: { color: '#fff', fontWeight: '600', fontSize: 14 },
  error: { color: '#ff453a', marginTop: Spacing.two, fontSize: 14 },
  primaryButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
