import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface PremiumLockModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string;
}

export function PremiumLockModal({ visible, onClose, title, body }: PremiumLockModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <ThemedView style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Ionicons name="lock-closed" size={28} color="#C01918" />
          <ThemedText type="smallBold" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="small" style={styles.body}>
            {body}
          </ThemedText>
          <Pressable style={styles.button} onPress={onClose}>
            <ThemedText style={styles.buttonText}>Got it</ThemedText>
          </Pressable>
        </ThemedView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  sheet: {
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    maxWidth: 320,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', opacity: 0.7 },
  button: {
    marginTop: Spacing.two,
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
