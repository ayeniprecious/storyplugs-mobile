import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useTheme } from '@/hooks/use-theme';
import { useNotifications } from '@/hooks/use-notifications';

// Home-only top bar (its only call sites are index.tsx and HeroBanner,
// both Home). No profile avatar anymore -- Profile has its own bottom tab
// now, so a second entry point up here was redundant. `title` sits inline
// beside the logo, bold enough to read as a page title rather than a caption.
// Left optional so this stays reusable if another screen ever wants a bare
// icon bar without one.
export function TopNav({ overlay = false, title }: { overlay?: boolean; title?: string }) {
  const { unreadCount } = useNotifications();
  const { settings } = useAppSettings();
  const appName = settings.app_name || 'StoryPlugs';
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const iconColor = overlay ? '#fff' : theme.text;

  return (
    <ThemedView
      style={[
        styles.wrapper,
        overlay && { paddingTop: insets.top + Spacing.two, backgroundColor: 'transparent' },
      ]}
    >
      <ThemedView style={[styles.bar, overlay && styles.transparentBg]}>
        <ThemedView style={[styles.brandGroup, overlay && styles.transparentBg]}>
          <Image
            source={require('@/assets/images/logo-mark.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel={appName}
          />
          {title && (
            <ThemedText
              style={[styles.pageTitle, overlay && styles.pageTitleOverlay, { color: iconColor }]}
            >
              {title}
            </ThemedText>
          )}
        </ThemedView>
        <ThemedView style={[styles.actions, overlay && styles.transparentBg]}>
          <Link href="/search" asChild>
            <Pressable style={styles.iconButton} accessibilityLabel="Search">
              <Ionicons name="search-outline" size={26} color={iconColor} style={styles.iconShadow} />
            </Pressable>
          </Link>
          <Link href="/notifications" asChild>
            <Pressable style={styles.iconButton} accessibilityLabel="Notifications">
              <Ionicons name="notifications-outline" size={26} color={iconColor} style={styles.iconShadow} />
              {unreadCount > 0 && (
                <ThemedView style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </ThemedText>
                </ThemedView>
              )}
            </Pressable>
          </Link>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.two + 4,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  logo: { width: 36, height: 36 },
  pageTitle: { fontSize: 22, lineHeight: 26, fontWeight: '800' },
  pageTitleOverlay: {
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  transparentBg: { backgroundColor: 'transparent' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconButton: { padding: 4 },
  // A soft shadow behind the glyph itself (Ionicons renders as a text glyph,
  // so textShadow -- not the View-only shadow/elevation props -- is what
  // actually follows its silhouette and works the same on iOS/Android/web).
  iconShadow: {
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C01918',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
