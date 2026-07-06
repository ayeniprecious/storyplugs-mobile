import { Tabs } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useThemePrefs } from '@/context/theme-prefs-context';
import { useNotificationResponseHandler } from '@/hooks/use-notification-response';
import { usePushRegistration } from '@/hooks/use-push-registration';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <ThemedText style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</ThemedText>;
}

export default function AppTabsLayout() {
  const { resolvedScheme } = useThemePrefs();
  const colors = Colors[resolvedScheme];
  usePushRegistration();
  useNotificationResponseHandler();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#e50914',
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'My Library',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
