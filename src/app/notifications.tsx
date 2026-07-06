import { Link, router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          <Link href="/(app)" style={styles.backLink}>
            <ThemedText type="link">← Back</ThemedText>
          </Link>
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
          <ActivityIndicator style={styles.loader} />
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
              <Pressable onPress={() => handleOpen(item)}>
                <ThemedView
                  type="backgroundElement"
                  style={[styles.row, !item.read && styles.rowUnread]}
                >
                  <ThemedView style={styles.rowBody}>
                    <ThemedView style={styles.rowHeaderLine}>
                      {!item.read && <ThemedView style={styles.unreadDot} />}
                      <ThemedText type={item.read ? 'default' : 'smallBold'} numberOfLines={1}>
                        {item.notification.title}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText type="small" style={styles.rowText} numberOfLines={2}>
                      {item.notification.body}
                    </ThemedText>
                    <ThemedText type="small" style={styles.rowTime}>
                      {timeAgo(item.createdAt)}
                    </ThemedText>
                  </ThemedView>
                  <Pressable
                    onPress={() => remove(item.id)}
                    hitSlop={8}
                    accessibilityLabel="Delete notification"
                  >
                    <ThemedText style={styles.removeButton}>✕</ThemedText>
                  </Pressable>
                </ThemedView>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.two },
  backLink: {},
  title: { fontSize: 26, lineHeight: 32 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.three },
  action: { color: '#e50914' },
  actionDisabled: { opacity: 0.3 },
  loader: { marginTop: Spacing.five },
  emptyHint: { opacity: 0.6, marginTop: Spacing.four },
  list: { paddingBottom: Spacing.six, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowUnread: { borderWidth: 1, borderColor: 'rgba(229,9,20,0.4)' },
  rowBody: { flex: 1, gap: 4, backgroundColor: 'transparent' },
  rowHeaderLine: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'transparent' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e50914' },
  rowText: { opacity: 0.75 },
  rowTime: { opacity: 0.5 },
  removeButton: { opacity: 0.5, fontSize: 14, paddingHorizontal: 4 },
});
