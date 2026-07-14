import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { RankedPosterRow } from '@/components/ranked-poster-row';
import { Skeleton } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useNotifications, type NotificationItem } from '@/hooks/use-notifications';

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

export default function Notifications() {
  const { items, loading, unreadCount, markAsRead, markAllAsRead, remove, clearAll } = useNotifications();

  function handleOpen(item: NotificationItem) {
    if (!item.read) markAsRead(item.id);
    if (item.notification.story_id) {
      router.push({ pathname: '/story/[id]', params: { id: item.notification.story_id } });
    }
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
          <Pressable onPress={markAllAsRead} disabled={unreadCount === 0}>
            <ThemedText type="small" style={unreadCount === 0 ? styles.actionDisabled : styles.action}>
              Mark all read
            </ThemedText>
          </Pressable>
          <Pressable onPress={clearAll} disabled={items.length === 0}>
            <ThemedText type="small" style={items.length === 0 ? styles.actionDisabled : styles.action}>
              Clear all
            </ThemedText>
          </Pressable>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.list}>
            {[0, 1, 2, 3].map((i) => (
              <ThemedView key={i} type="backgroundElement" style={styles.row}>
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
              <ThemedView type="backgroundElement" style={styles.row}>
                <ThemedView style={styles.rowTop}>
                  <Pressable onPress={() => handleOpen(item)} style={styles.rowPressable}>
                    <ThemedView style={styles.rowBody}>
                      <ThemedView style={styles.rowHeaderLine}>
                        <ThemedView style={[styles.unreadDot, item.read && styles.readDot]} />
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
                  <Pressable
                    onPress={() => remove(item.id)}
                    hitSlop={8}
                    accessibilityLabel="Delete notification"
                  >
                    <Ionicons name="close" size={16} color="#8a8a8e" style={styles.removeButton} />
                  </Pressable>
                </ThemedView>
                {item.stories.length > 0 && (
                  <ThemedView style={styles.posterRowWrap}>
                    <RankedPosterRow stories={item.stories} />
                  </ThemedView>
                )}
              </ThemedView>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.two + 4, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.three },
  action: { color: '#C01918' },
  actionDisabled: { opacity: 0.3 },
  emptyHint: { opacity: 0.6, marginTop: Spacing.four },
  skeletonLineTitle: { width: '50%', height: 20, borderRadius: 4 },
  skeletonLineBody: { width: '90%', height: 20, borderRadius: 4 },
  skeletonLineBodyShort: { width: '60%', height: 20, borderRadius: 4 },
  skeletonLineTime: { width: '25%', height: 20, borderRadius: 4 },
  list: { paddingBottom: Spacing.six, gap: Spacing.two },
  row: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, backgroundColor: 'transparent' },
  rowPressable: { flex: 1 },
  rowBody: { flex: 1, gap: 4, backgroundColor: 'transparent' },
  posterRowWrap: { marginLeft: 13, backgroundColor: 'transparent' },
  rowHeaderLine: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C01918' },
  readDot: { backgroundColor: '#fff' },
  // Lines up with the title text, which starts after the 7px dot + 6px gap in rowHeaderLine.
  rowText: { opacity: 0.75, marginLeft: 13 },
  rowTime: { opacity: 0.5, marginLeft: 13 },
  removeButton: { paddingHorizontal: 4 },
});
