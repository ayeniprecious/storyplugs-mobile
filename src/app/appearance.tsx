import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { FontScaleKey, ThemeMode, useThemePrefs } from '@/context/theme-prefs-context';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const FONT_OPTIONS: { value: FontScaleKey; label: string }[] = [
  { value: 'small', label: 'A' },
  { value: 'medium', label: 'A' },
  { value: 'large', label: 'A' },
  { value: 'xlarge', label: 'A' },
];

export default function Appearance() {
  const { themeMode, setThemeMode, fontScaleKey, setFontScaleKey } = useThemePrefs();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/profile" />
          <ThemedText type="title" style={styles.title}>
            Appearance
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="small" style={styles.sectionHint}>
            Theme
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {THEME_OPTIONS.map((opt) => {
              const selected = themeMode === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setThemeMode(opt.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <ThemedText type="small" style={styles.sectionHint}>
            Text Size
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {FONT_OPTIONS.map((opt, i) => {
              const selected = fontScaleKey === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setFontScaleKey(opt.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <ThemedText
                    style={[{ fontSize: 14 + i * 3 }, selected && styles.chipTextSelected]}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
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
  chipSelected: { backgroundColor: '#C01918' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
});
