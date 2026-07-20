import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GOAL_OPTIONS, STORY_LENGTH_OPTIONS } from '@/constants/personalization-options';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useProfile } from '@/context/profile-context';
import type { StoryLengthPref } from '@/lib/database.types';

export default function Preferences() {
  const { profile, savePersonalization } = useProfile();
  const { order: categoryOrder, labels: categoryLabels } = useCategories();

  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [storyLength, setStoryLength] = useState<StoryLengthPref>('any');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setInterests(profile.interests);
      setGoals(profile.personal_goals);
      setStoryLength(profile.story_length_pref ?? 'any');
    }
  }, [profile]);

  function toggleInterest(value: string) {
    setSaved(false);
    setInterests((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function toggleGoal(value: string) {
    setSaved(false);
    setGoals((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleSave() {
    setSaving(true);
    await savePersonalization(interests, goals, storyLength);
    setSaving(false);
    setSaved(true);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            Preferences
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="small" style={styles.sectionHint}>
            Themes you love
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {categoryOrder.map((slug) => {
              const selected = interests.includes(slug);
              return (
                <Pressable
                  key={slug}
                  onPress={() => toggleInterest(slug)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                    {categoryLabels[slug] ?? slug}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <ThemedText type="small" style={styles.sectionHint}>
            What brings you here
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {GOAL_OPTIONS.map((goal) => {
              const selected = goals.includes(goal.value);
              return (
                <Pressable
                  key={goal.value}
                  onPress={() => toggleGoal(goal.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                    {goal.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <ThemedText type="small" style={styles.sectionHint}>
            Preferred story length
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {STORY_LENGTH_OPTIONS.map((option) => {
              const selected = storyLength === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setSaved(false);
                    setStoryLength(option.value);
                  }}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : saved ? (
              <ThemedView style={styles.saveButtonContent}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <ThemedText style={styles.saveButtonText}>Saved</ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={styles.saveButtonText}>Save Preferences</ThemedText>
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
  scrollContent: { paddingBottom: Spacing.six },
  sectionHint: { opacity: 0.6, marginTop: Spacing.two, marginBottom: Spacing.two },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  chipSelected: { backgroundColor: '#54545a' },
  chipTextSelected: { color: '#fff' },
  saveButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  saveButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
});
