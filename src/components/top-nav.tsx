import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/hooks/use-theme';
import { useNotifications } from '@/hooks/use-notifications';

export function TopNav({ overlay = false }: { overlay?: boolean }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const initial = (profile?.display_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();
  const iconColor = overlay ? '#fff' : theme.text;

  return (
    <ThemedView
      style={[
        styles.bar,
        overlay && { paddingTop: insets.top + Spacing.two, backgroundColor: 'transparent' },
      ]}
    >
      <Image
        source={require('@/assets/images/logo-mark.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="StoryPlugs"
      />
      <ThemedView style={[styles.actions, overlay && styles.transparentBg]}>
        <Link href="/search" asChild>
          <Pressable style={styles.iconButton} accessibilityLabel="Search">
            <Ionicons name="search-outline" size={20} color={iconColor} />
          </Pressable>
        </Link>
        <Link href="/notifications" asChild>
          <Pressable style={styles.iconButton} accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={20} color={iconColor} />
            {unreadCount > 0 && (
              <ThemedView style={styles.badge}>
                <ThemedText style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </ThemedText>
              </ThemedView>
            )}
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable accessibilityLabel="Profile">
            <Avatar url={profile?.avatar_url} fallbackLetter={initial} size={30} />
          </Pressable>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  logo: { width: 44, height: 44 },
  transparentBg: { backgroundColor: 'transparent' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconButton: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#700a0a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
