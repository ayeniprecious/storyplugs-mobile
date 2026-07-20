import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type ViewShotRef } from 'react-native-view-shot';

import { RecapShareCard, RECAP_CARD_WIDTH } from '@/components/recap-share-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { RecapData } from '@/lib/reading-recap';

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
  const shotRef = useRef<ViewShotRef>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function capture(): Promise<string | null> {
    try {
      const uri = await shotRef.current?.capture?.();
      return uri ?? null;
    } catch {
      setMessage("Couldn't generate the image — try again.");
      return null;
    }
  }

  async function handleDownload() {
    if (Platform.OS === 'web') {
      setMessage('Downloading images isn’t supported on web — use the app.');
      return;
    }
    setMessage(null);
    setSaving(true);
    const uri = await capture();
    if (uri) {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        setMessage('Saved to your photos.');
      } else {
        setMessage('Photo library access is needed to save the image.');
      }
    }
    setSaving(false);
  }

  async function handleShare() {
    if (Platform.OS === 'web') {
      setMessage('Sharing isn’t supported on web — use the app.');
      return;
    }
    setMessage(null);
    setSharing(true);
    const uri = await capture();
    if (uri) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } else {
        setMessage('Sharing is not available on this device.');
      }
    }
    setSharing(false);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.cardWrap}>
            <RecapShareCard ref={shotRef} data={data} appName={appName} topCategoryLabel={topCategoryLabel} />
          </View>

          {message && <ThemedText style={styles.message}>{message}</ThemedText>}

          <View style={styles.buttonRow}>
            <Pressable style={styles.secondaryButton} onPress={handleDownload} disabled={saving || sharing}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  <ThemedText style={styles.secondaryButtonText}>Download</ThemedText>
                </>
              )}
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleShare} disabled={saving || sharing}>
              {sharing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={18} color="#fff" />
                  <ThemedText style={styles.primaryButtonText}>Share</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  safeArea: { flex: 1, alignItems: 'center' },
  header: { width: '100%', alignItems: 'flex-end', paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.two },
  cardWrap: {
    marginTop: Spacing.three,
    borderRadius: 24,
    overflow: 'hidden',
    width: RECAP_CARD_WIDTH,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  message: { color: '#fff', opacity: 0.8, marginTop: Spacing.three, textAlign: 'center' },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 'auto',
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: Spacing.three,
  },
  secondaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C01918',
    borderRadius: 12,
    paddingVertical: Spacing.three,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
