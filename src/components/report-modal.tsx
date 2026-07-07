import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useReports } from '@/hooks/use-reports';
import type { ReportTargetType } from '@/lib/database.types';

const REASONS = ['Spam', 'Inappropriate content', 'Harassment', 'Something else'];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}

export function ReportModal({ visible, onClose, targetType, targetId }: ReportModalProps) {
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
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {done ? (
            <View style={styles.doneBlock}>
              <Ionicons name="checkmark-circle" size={32} color="#32b45a" />
              <Text style={styles.doneText}>Thanks — we&apos;ll take a look.</Text>
              <Pressable style={styles.primaryButton} onPress={handleClose}>
                <Text style={styles.primaryButtonText}>Close</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.title}>
                Report this {targetType === 'story' ? 'story' : targetType === 'comment' ? 'comment' : 'user'}
              </Text>
              {REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => {
                    setReason(r);
                    setError(null);
                  }}
                  style={[styles.reasonRow, reason === r && styles.reasonRowSelected]}
                >
                  <Text style={styles.reasonText}>{r}</Text>
                  <View style={[styles.radio, reason === r && styles.radioSelected]}>
                    {reason === r && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              ))}
              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit Report</Text>
                )}
              </Pressable>
              <Pressable onPress={handleClose} hitSlop={8}>
                <Text style={styles.cancelText}>Cancel</Text>
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
    backgroundColor: '#161616',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: Spacing.two },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    marginBottom: Spacing.one,
  },
  reasonRowSelected: { borderColor: '#C01918' },
  reasonText: { color: '#fff', fontSize: 14 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3a3a3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#C01918' },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#C01918' },
  error: { color: '#ff453a', fontSize: 13, marginTop: Spacing.one },
  primaryButton: {
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: Spacing.two, fontSize: 14 },
  doneBlock: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  doneText: { color: '#fff', fontSize: 15, textAlign: 'center' },
});
