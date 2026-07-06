import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const theme = useTheme();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.base, { backgroundColor: theme.backgroundElement, opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 8, overflow: 'hidden' },
});
