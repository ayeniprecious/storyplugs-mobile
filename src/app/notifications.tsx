import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet } from 'react-native';
// The classic (Animated-based) Swipeable from the package root invokes
// renderLeftActions/renderRightActions outside React's render pass on web,
// which throws "Invalid hook call" for any child that isn't a completely
// hook-free primitive. The Reanimated-based Swipeable doesn't have this
// problem, and reanimated is already a dependency here.
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { RankedPosterRow } from '@/components/ranked-poster-row';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useNotifications, type NotificationItem } from '@/hooks/use-notifications';
import { useTheme } from '@/hooks/use-theme';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Revealed by the swipe, but deletion only happens on an explicit tap here --
// swiping it open by itself must never delete anything.
function DeleteAction({ onPress }: { onPress: () => void }) {
  return (
    <ThemedView style={styles.deleteActionWrap}>
      <Pressable style={styles.deleteAction} onPress={onPress}>
        <Ionicons name="trash-outline" size={18} color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

export default function Notifications() {
  const { items, loading, markAsRead, markAllAsRead, remove, clearAll } = useNotifications();
  const theme = useTheme();
  const [confirmingClear, setConfirmingClear] = useState(false);

  // Opening the inbox marks everything read, same as most mail/notification
  // apps -- no separate "mark all read" action needed, and it re-fires each
  // time this screen regains focus, not just on first mount.
  useFocusEffect(
    useCallback(() => {
      markAllAsRead();
    }, [markAllAsRead])
  );

  function handleOpen(item: NotificationItem) {
    if (!item.read) markAsRead(item.id);
    if (item.notification.story_id) {
      router.push({ pathname: '/story/[id]', params: { id: item.notification.story_id } });
    }
  }

  function handleClearAll() {
    setConfirmingClear(false);
    clearAll();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <BackButton href="/(app)" />
          <ThemedText type="title" style={styles.title}>
            Notifications
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.actionsRow}>
          <Pressable onPress={() => setConfirmingClear(true)} disabled={items.length === 0}>
            <ThemedText type="small" style={items.length === 0 ? styles.actionDisabled : styles.action}>
              Clear all
            </ThemedText>
          </Pressable>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.list}>
            {[0, 1, 2, 3].map((i) => (
              <ThemedView key={i} type="cardAshSolid" style={styles.row}>
                <ThemedView style={styles.rowBody}>
                  <Skeleton style={styles.skeletonLineTitle} />
                  <Skeleton style={styles.skeletonLineBody} />
                  <Skeleton style={styles.skeletonLineBodyShort} />
                  <Skeleton style={styles.skeletonLineTime} />
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        ) : items.length === 0 ? (
          <ThemedText type="small" style={styles.emptyHint}>
            No notifications yet.
          </ThemedText>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              // Swipe either direction to reveal the delete button -- replaces
              // the old per-row "x". No onSwipeableOpen: the swipe itself
              // only reveals DeleteAction, it never deletes by itself. Only
              // an explicit tap on the red button removes the notification.
              <Swipeable
                renderLeftActions={() => <DeleteAction onPress={() => remove(item.id)} />}
                renderRightActions={() => <DeleteAction onPress={() => remove(item.id)} />}
                overshootLeft={false}
                overshootRight={false}
              >
                <ThemedView type="cardAshSolid" style={styles.row}>
                  <Pressable onPress={() => handleOpen(item)}>
                    <ThemedView style={styles.rowBody}>
                      <ThemedView style={styles.rowHeaderLine}>
                        <ThemedView
                          style={[styles.dot, { backgroundColor: item.read ? theme.text : '#C01918' }]}
                        />
                        <ThemedText type={item.read ? 'small' : 'smallBold'} numberOfLines={1}>
                          {item.notification.title}
                        </ThemedText>
                      </ThemedView>
                      <ThemedText type="small" style={styles.rowText}>
                        {item.notification.body}
                      </ThemedText>
                      <ThemedText type="small" style={styles.rowTime}>
                        {timeAgo(item.createdAt)}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                  {item.stories.length > 0 && (
                    <ThemedView style={styles.posterRowWrap}>
                      <RankedPosterRow stories={item.stories} />
                    </ThemedView>
                  )}
                </ThemedView>
              </Swipeable>
            )}
          />
        )}
      </SafeAreaView>

      <Modal
        visible={confirmingClear}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingClear(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmingClear(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <ThemedView type="backgroundElement" style={styles.modalCard}>
              <ThemedText type="smallBold" style={styles.modalTitle}>
                Clear all notifications?
              </ThemedText>
              <ThemedText type="small" style={styles.modalBody}>
                This removes every notification from your inbox. This can&apos;t be undone.
              </ThemedText>
              <ThemedView style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, { borderColor: theme.border }]}
                  onPress={() => setConfirmingClear(false)}
                >
                  <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
                </Pressable>
                <Pressable style={[styles.modalButton, styles.modalDeleteButton]} onPress={handleClearAll}>
                  <ThemedText style={styles.modalDeleteText}>Clear All</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Spacing.three },
  action: { color: '#C01918' },
  actionDisabled: { opacity: 0.3 },
  emptyHint: { opacity: 0.6, marginTop: Spacing.four },
  skeletonLineTitle: { width: '50%', height: 20, borderRadius: 4 },
  skeletonLineBody: { width: '90%', height: 20, borderRadius: 4 },
  skeletonLineBodyShort: { width: '60%', height: 20, borderRadius: 4 },
  skeletonLineTime: { width: '25%', height: 20, borderRadius: 4 },
  list: { paddingBottom: Spacing.six, gap: Spacing.two },
  // Opaque (cardAshSolid via the type prop above), not the translucent CardAsh
  // -- during a swipe, the red DeleteAction sits directly behind this row,
  // and a translucent fill let it bleed/show through mid-slide instead of
  // staying fully hidden until the row has actually moved out of the way.
  row: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
  },
  rowBody: { gap: 4, backgroundColor: 'transparent' },
  posterRowWrap: { marginLeft: 13, backgroundColor: 'transparent' },
  rowHeaderLine: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  // Lines up with the title text, which starts after the 7px dot + 6px gap in rowHeaderLine.
  rowText: { opacity: 0.75, marginLeft: 13 },
  rowTime: { opacity: 0.5, marginLeft: 13 },
  deleteActionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    backgroundColor: 'transparent',
  },
  deleteAction: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#C01918',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  modalTitle: { fontSize: 17 },
  modalBody: { opacity: 0.75, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two, backgroundColor: 'transparent' },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  modalCancelText: { fontWeight: '600' },
  modalDeleteButton: { backgroundColor: '#ff453a', borderColor: '#ff453a' },
  modalDeleteText: { color: '#fff', fontWeight: '600' },
});
