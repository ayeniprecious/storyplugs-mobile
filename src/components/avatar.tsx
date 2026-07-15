import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface AvatarProps {
  url?: string | null;
  fallbackLetter: string;
  size?: number;
  streakCount?: number;
  premium?: boolean;
}

export function Avatar({ url, fallbackLetter, size = 30, streakCount = 0, premium = false }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };
  // Instagram-style "active story" ring -- a gradient circle just larger
  // than the avatar itself, with the avatar inset inside it via padding.
  const ringWidth = Math.max(2, Math.round(size * 0.09));
  const ringSize = size + ringWidth * 2;

  const streakBadge = streakCount > 0 && (
    <View
      style={[
        styles.streakBadge,
        {
          minWidth: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          // Anchored to the actual avatar's top edge, not the wider ring
          // around it, so it doesn't drift outward when premium is true.
          top: premium ? -6 - ringWidth : -6,
        },
      ]}
    >
      <ThemedText style={[styles.streakBadgeText, { fontSize: size * 0.32 }]}>{streakCount}</ThemedText>
    </View>
  );

  const inner = url ? (
    <Image source={{ uri: url }} style={[styles.image, dimensionStyle]} contentFit="cover" />
  ) : (
    <View style={[styles.fallback, dimensionStyle]}>
      <ThemedText style={[styles.fallbackText, { fontSize: size * 0.42 }]}>
        {fallbackLetter.toUpperCase()}
      </ThemedText>
    </View>
  );

  return (
    <View>
      {premium ? (
        <LinearGradient
          colors={['#FFD86B', '#C01918', '#7A1140']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: ringSize, height: ringSize, borderRadius: ringSize / 2, padding: ringWidth }}
        >
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
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
