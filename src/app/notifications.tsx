import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
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
import { useThemePrefs } from '@/context/theme-prefs-context';
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
    <Pressable style={styles.deleteAction} onPress={onPress}>
      <Ionicons name="trash-outline" size={20} color="#fff" />
    </Pressable>
  );
}

export default function Notifications() {
  const { items, loading, unreadCount, markAsRead, markAllAsRead, remove, clearAll } = useNotifications();
  const theme = useTheme();
  const { resolvedScheme } = useThemePrefs();
  const blurTint = resolvedScheme === 'dark' ? 'dark' : 'light';

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
              <ThemedView key={i} style={styles.row}>
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
                <BlurView
                  intensity={40}
                  tint={blurTint}
                  style={[styles.row, { borderColor: theme.border }]}
                >
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
                </BlurView>
              </Swipeable>
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
    borderWidth: StyleSheet.hairlineWidth,
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
  deleteAction: {
    width: 80,
    borderRadius: 12,
    marginVertical: 2,
    backgroundColor: '#C01918',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
