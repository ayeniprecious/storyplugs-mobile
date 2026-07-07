import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <LinearGradient colors={['#2a070b', '#000000']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={12} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.6)" />
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}
          <View style={styles.progressDots}>
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <View key={i} style={[styles.dot, i === step ? styles.dotActive : i < step && styles.dotDone]} />
            ))}
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {step === 0 && (
            <>
              <Text style={styles.title}>What speaks to you?</Text>
              <Text style={styles.subtitle}>
                Pick the themes you&apos;d love to see more of — choose as many as you like.
              </Text>
              <View style={styles.chipWrap}>
                {categoryOrder.map((slug) => {
                  const selected = interests.includes(slug);
                  return (
                    <Pressable
                      key={slug}
                      onPress={() => toggle(interests, setInterests, slug)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      {selected && <Ionicons name="checkmark" size={15} color="#fff" />}
                      <Text style={selected ? styles.chipTextSelected : styles.chipText}>
                        {categoryLabels[slug] ?? slug}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.title}>What brings you here?</Text>
              <Text style={styles.subtitle}>
                So we know what to send your way. Pick everything that fits.
              </Text>
              {GOAL_OPTIONS.map((goal) => {
                const selected = goals.includes(goal.value);
                return (
                  <Pressable
                    key={goal.value}
                    onPress={() => toggle(goals, setGoals, goal.value)}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                  >
                    <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                      <Ionicons name={goal.icon} size={20} color={selected ? '#fff' : '#C01918'} />
                    </View>
                    <View style={styles.optionTextGroup}>
                      <Text style={styles.optionLabel}>{goal.label}</Text>
                      <Text style={styles.optionBlurb}>{goal.blurb}</Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={22} color="#C01918" />}
                  </Pressable>
                );
              })}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>How do you like your stories?</Text>
              <Text style={styles.subtitle}>
                We&apos;ll lean toward this length when picking stories for you.
              </Text>
              {STORY_LENGTH_OPTIONS.map((option) => {
                const selected = storyLength === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setStoryLength(option.value)}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                  >
                    <View style={styles.optionTextGroup}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionBlurb}>{option.blurb}</Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.primaryButton} onPress={handleContinue} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {step < STEP_COUNT - 1 ? 'Continue' : 'Start my journey'}
              </Text>
            )}
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
  backButton: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.two + 4, paddingVertical: Spacing.three, gap: Spacing.two },
  footer: { paddingHorizontal: Spacing.two + 4, paddingBottom: Spacing.three, gap: Spacing.two },
  title: { color: '#fff', fontSize: 24, lineHeight: 30, marginBottom: Spacing.two, fontWeight: '600' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: Spacing.three },
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
  chipText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  chipTextSelected: { color: '#fff', fontWeight: '600', fontSize: 14 },
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  optionIconSelected: { backgroundColor: '#C01918' },
  optionTextGroup: { flex: 1, gap: 2 },
  optionLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  optionBlurb: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
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
  error: { color: '#ff453a', marginTop: Spacing.two, fontSize: 14 },
  primaryButton: {
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
