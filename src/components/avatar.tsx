import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface AvatarProps {
  url?: string | null;
  fallbackLetter: string;
  size?: number;
  streakCount?: number;
}

export function Avatar({ url, fallbackLetter, size = 30, streakCount = 0 }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  const streakBadge = streakCount > 0 && (
    <View style={[styles.streakBadge, { minWidth: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }]}>
      <ThemedText style={[styles.streakBadgeText, { fontSize: size * 0.32 }]}>{streakCount}</ThemedText>
    </View>
  );

  if (url) {
    return (
      <View>
        <Image source={{ uri: url }} style={[styles.image, dimensionStyle]} contentFit="cover" />
        {streakBadge}
      </View>
    );
  }

  return (
    <View>
      <View style={[styles.fallback, dimensionStyle]}>
        <ThemedText style={[styles.fallbackText, { fontSize: size * 0.42 }]}>
          {fallbackLetter.toUpperCase()}
        </ThemedText>
      </View>
      {streakBadge}
    </View>
  );
}

const styles = StyleSheet.create({
  // White, not the theme background -- so a transparent-background upload shows
  // cleanly instead of blending into the dark theme.
  image: { backgroundColor: '#ffffff' },
  fallback: {
    backgroundColor: '#C01918',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { color: '#fff', fontWeight: '600' },
  streakBadge: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    backgroundColor: '#C01918',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  streakBadgeText: { color: '#fff', fontWeight: '700' },
});
