import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GOAL_OPTIONS, STORY_LENGTH_OPTIONS } from '@/constants/personalization-options';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useProfile } from '@/context/profile-context';
import type { StoryLengthPref } from '@/lib/database.types';

const STEP_COUNT = 3;

export default function Personalize() {
  const { savePersonalization } = useProfile();
  const { order: categoryOrder, labels: categoryLabels } = useCategories();

  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [storyLength, setStoryLength] = useState<StoryLengthPref>('any');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setError(null);
  }

  function handleContinue() {
    if (step === 0 && interests.length === 0) {
      setError('Pick at least one theme to continue.');
      return;
    }
    if (step === 1 && goals.length === 0) {
      setError('Pick at least one to continue.');
      return;
    }
    setError(null);
    if (step < STEP_COUNT - 1) {
      setStep(step + 1);
      return;
    }
    handleFinish();
  }

  async function handleFinish() {
    setSubmitting(true);
    const { error: saveError } = await savePersonalization(interests, goals, storyLength);
    setSubmitting(false);
    if (saveError) setError(saveError);
    // On success the profile refreshes and the root layout re-routes: to the
    // notification-preferences step for new users, or straight into the app.
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          {step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={12} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color="#8a8a8e" />
              <ThemedText type="small" style={styles.backLabel}>
                Back
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedView style={styles.backButton} />
          )}
          <ThemedView style={styles.progressDots}>
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <ThemedView
                key={i}
                style={[styles.dot, i === step ? styles.dotActive : i < step && styles.dotDone]}
              />
            ))}
          </ThemedView>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 0 && (
            <>
              <ThemedText type="title" style={styles.title}>
                What speaks to you?
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Pick the themes you&apos;d love to see more of — choose as many as you like.
              </ThemedText>
              <ThemedView style={styles.chipWrap}>
                {categoryOrder.map((slug) => {
                  const selected = interests.includes(slug);
                  return (
                    <Pressable
                      key={slug}
                      onPress={() => toggle(interests, setInterests, slug)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      {selected && <Ionicons name="checkmark" size={15} color="#fff" />}
                      <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                        {categoryLabels[slug] ?? slug}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ThemedView>
            </>
          )}

          {step === 1 && (
            <>
              <ThemedText type="title" style={styles.title}>
                What brings you here?
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                So we know what to send your way. Pick everything that fits.
              </ThemedText>
              {GOAL_OPTIONS.map((goal) => {
                const selected = goals.includes(goal.value);
                return (
                  <Pressable
                    key={goal.value}
                    onPress={() => toggle(goals, setGoals, goal.value)}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                  >
                    <ThemedView
                      type="backgroundElement"
                      style={[styles.optionIcon, selected && styles.optionIconSelected]}
                    >
                      <Ionicons name={goal.icon} size={20} color={selected ? '#fff' : '#C01918'} />
                    </ThemedView>
                    <ThemedView style={styles.optionTextGroup}>
                      <ThemedText type="smallBold">{goal.label}</ThemedText>
                      <ThemedText type="small" style={styles.optionBlurb}>
                        {goal.blurb}
                      </ThemedText>
                    </ThemedView>
                    {selected && <Ionicons name="checkmark-circle" size={22} color="#C01918" />}
                  </Pressable>
                );
              })}
            </>
          )}

          {step === 2 && (
            <>
              <ThemedText type="title" style={styles.title}>
                How do you like your stories?
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                We&apos;ll lean toward this length when picking stories for you.
              </ThemedText>
              {STORY_LENGTH_OPTIONS.map((option) => {
                const selected = storyLength === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setStoryLength(option.value)}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                  >
                    <ThemedView style={styles.optionTextGroup}>
                      <ThemedText type="smallBold">{option.label}</ThemedText>
                      <ThemedText type="small" style={styles.optionBlurb}>
                        {option.blurb}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <ThemedView style={styles.radioInner} />}
                    </ThemedView>
                  </Pressable>
                );
              })}
            </>
          )}

          {error && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Pressable style={styles.primaryButton} onPress={handleContinue} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>
                {step < STEP_COUNT - 1 ? 'Continue' : 'Start my journey'}
              </ThemedText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.three,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backLabel: { opacity: 0.6 },
  progressDots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    // Keep the dots visually centered despite the back button on the left.
    marginRight: 70,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3a3a3c' },
  dotActive: { backgroundColor: '#C01918', width: 22 },
  dotDone: { backgroundColor: '#C01918', opacity: 0.5 },
  scrollContent: { paddingHorizontal: Spacing.two + 4, paddingVertical: Spacing.three, gap: Spacing.two },
  title: { fontSize: 24, lineHeight: 30, marginBottom: Spacing.two },
  subtitle: { opacity: 0.75, marginBottom: Spacing.three },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  chipSelected: { backgroundColor: '#C01918', borderColor: '#C01918' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
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
  optionCardSelected: { borderColor: '#C01918' },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: '#C01918' },
  optionTextGroup: { flex: 1, gap: 2 },
  optionBlurb: { opacity: 0.6 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3a3a3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#C01918' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C01918' },
  error: { color: '#ff453a', marginTop: Spacing.two },
  primaryButton: {
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
