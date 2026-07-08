import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsGroup } from '@/components/settings-group';
import { SettingsRow } from '@/components/settings-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CONTENT_TYPE_OPTIONS, TIME_SLOT_OPTIONS } from '@/constants/notification-options';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationContentType } from '@/lib/database.types';

export default function NotificationSettings() {
  const theme = useTheme();
  const { profile, saveNotificationPreferences } = useProfile();

  const [selectedTypes, setSelectedTypes] = useState<NotificationContentType[]>([]);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedTypes(profile.notification_types);
      setSelectedTime(profile.notification_time.slice(0, 5));
    }
  }, [profile]);

  function toggleType(value: NotificationContentType, enabled: boolean) {
    setSaved(false);
    setSelectedTypes((prev) => (enabled ? [...prev, value] : prev.filter((v) => v !== value)));
  }

  async function handleSave() {
    if (selectedTypes.length === 0) return;
    setSaving(true);
    await saveNotificationPreferences(selectedTypes, selectedTime);
    setSaving(false);
    setSaved(true);
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
            Notifications
          </ThemedText>
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SettingsGroup>
            {CONTENT_TYPE_OPTIONS.map((type, i) => (
              <SettingsRow
                key={type.value}
                label={type.label}
                isLast={i === CONTENT_TYPE_OPTIONS.length - 1}
                right={
                  <Switch
                    value={selectedTypes.includes(type.value)}
                    onValueChange={(v) => toggleType(type.value, v)}
                    trackColor={{ false: theme.border, true: theme.backgroundSelected }}
                    thumbColor={theme.text}
                  />
                }
              />
            ))}
          </SettingsGroup>

          <ThemedText type="smallBold" style={styles.sectionHint}>
            Delivery time
          </ThemedText>
          <ThemedView style={styles.chipWrap}>
            {TIME_SLOT_OPTIONS.map((slot) => {
              const selected = selectedTime === slot.value;
              return (
                <Pressable
                  key={slot.value}
                  onPress={() => {
                    setSaved(false);
                    setSelectedTime(slot.value);
                  }}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                    {slot.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>

          <Pressable
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving || selectedTypes.length === 0}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : saved ? (
              <ThemedView style={styles.saveButtonContent}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <ThemedText style={styles.saveButtonText}>Saved</ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
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
  backLinkCombined: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  title: { fontSize: 24, lineHeight: 30 },
  scrollContent: { paddingBottom: Spacing.six },
  sectionHint: { opacity: 0.85, marginTop: Spacing.two, marginBottom: Spacing.two },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  chipSelected: { backgroundColor: '#700a0a' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
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
