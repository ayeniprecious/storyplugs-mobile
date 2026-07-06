import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface AvatarProps {
  url?: string | null;
  fallbackLetter: string;
  size?: number;
}

export function Avatar({ url, fallbackLetter, size = 30 }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (url) {
    return <Image source={{ uri: url }} style={[styles.image, dimensionStyle]} contentFit="cover" />;
  }

  return (
    <View style={[styles.fallback, dimensionStyle]}>
      <ThemedText style={[styles.fallbackText, { fontSize: size * 0.42 }]}>
        {fallbackLetter.toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: '#3a3a3c' },
  fallback: {
    backgroundColor: '#e50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { color: '#fff', fontWeight: '700' },
});
