import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useReports } from '@/hooks/use-reports';
import { useTheme } from '@/hooks/use-theme';
import type { ReportTargetType } from '@/lib/database.types';

const REASONS = ['Spam', 'Inappropriate content', 'Harassment', 'Something else'];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}

export function ReportModal({ visible, onClose, targetType, targetId }: ReportModalProps) {
  const theme = useTheme();
  const { submitting, submitReport } = useReports();
  const [reason, setReason] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setReason(null);
    setDone(false);
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!reason) {
      setError('Pick a reason to continue.');
      return;
    }
    const { error: submitError } = await submitReport(targetType, targetId, reason);
    if (submitError) setError(submitError);
    else setDone(true);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          {done ? (
            <ThemedView style={styles.doneBlock}>
              <Ionicons name="checkmark-circle" size={32} color="#32b45a" />
              <ThemedText style={styles.doneText}>Thanks — we&apos;ll take a look.</ThemedText>
              <Pressable style={styles.primaryButton} onPress={handleClose}>
                <ThemedText style={styles.primaryButtonText}>Close</ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <>
              <ThemedText type="smallBold" style={styles.title}>
                Report this {targetType === 'story' ? 'story' : targetType === 'comment' ? 'comment' : 'user'}
              </ThemedText>
              {REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => {
                    setReason(r);
                    setError(null);
                  }}
                  style={[styles.reasonRow, { borderColor: reason === r ? '#700a0a' : theme.border }]}
                >
                  <ThemedText type="small">{r}</ThemedText>
                  <ThemedView style={[styles.radio, { borderColor: reason === r ? '#700a0a' : theme.border }]}>
                    {reason === r && <ThemedView style={styles.radioInner} />}
                  </ThemedView>
                </Pressable>
              ))}
              {error && <ThemedText style={styles.error}>{error}</ThemedText>}
              <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>Submit Report</ThemedText>
                )}
              </Pressable>
              <Pressable onPress={handleClose} hitSlop={8}>
                <ThemedText type="small" style={styles.cancelText}>
                  Cancel
                </ThemedText>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: { fontSize: 17, marginBottom: Spacing.two },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: Spacing.one,
    backgroundColor: 'transparent',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#700a0a' },
  error: { color: '#ff453a', fontSize: 13, marginTop: Spacing.one },
  primaryButton: {
    backgroundColor: '#700a0a',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelText: { textAlign: 'center', marginTop: Spacing.two, opacity: 0.6 },
  doneBlock: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two, backgroundColor: 'transparent' },
  doneText: { fontSize: 15, textAlign: 'center' },
});
