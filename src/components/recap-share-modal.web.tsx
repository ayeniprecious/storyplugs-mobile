import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { RecapShareCard, RECAP_CARD_WIDTH } from '@/components/recap-share-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { RecapData } from '@/lib/reading-recap';

// Web has no photo library / native share sheet to hand a captured image to, and
// react-native-view-shot's web capture path (html2canvas) pulls in an ESM-only
// package Metro's web bundler can't interop with here -- so this stub renders the
// same preview card without the download/share machinery, rather than crashing
// the whole web bundle. Native (iOS/Android) uses recap-share-modal.tsx instead.
export function RecapShareModal({
  visible,
  onClose,
  data,
  appName,
  topCategoryLabel,
}: {
  visible: boolean;
  onClose: () => void;
  data: RecapData;
  appName: string;
  topCategoryLabel: string | null;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.cardWrap}>
          <RecapShareCard data={data} appName={appName} topCategoryLabel={topCategoryLabel} />
        </View>

        <ThemedText style={styles.message}>Download and sharing are available in the app.</ThemedText>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', paddingTop: Spacing.four },
  header: { width: '100%', alignItems: 'flex-end', paddingHorizontal: Spacing.two + 4 },
  cardWrap: {
    marginTop: Spacing.three,
    borderRadius: 24,
    overflow: 'hidden',
    width: RECAP_CARD_WIDTH,
  },
  message: { color: '#fff', opacity: 0.8, marginTop: Spacing.three, textAlign: 'center' },
});
