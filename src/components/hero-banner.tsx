import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { TopNav } from '@/components/top-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useFavorite } from '@/hooks/use-favorite';
import type { Story } from '@/lib/database.types';

export function HeroBanner({ story }: { story: Story }) {
  const { isFavorited, toggle: toggleFavorite } = useFavorite(story.id);
  const { labels: categoryLabels } = useCategories();

  return (
    <ThemedView style={styles.hero}>
      {story.image_url && (
        <Image source={{ uri: story.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.18, 0.45, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      <TopNav overlay />

      <ThemedView style={styles.content}>
        <ThemedText type="small" style={styles.tag}>
          {categoryLabels[story.category] ?? story.category} · Story of the Day
        </ThemedText>
        <ThemedText type="title" style={styles.title} numberOfLines={2}>
          {story.title}
        </ThemedText>
        <ThemedText style={styles.excerpt} numberOfLines={2}>
          {story.body}
        </ThemedText>
        <ThemedView style={styles.buttonRow}>
          <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
            <Pressable style={styles.ctaCombined}>
              <Ionicons name="play" size={16} color="#000" />
              <ThemedText style={styles.ctaText}>Read Full Story</ThemedText>
            </Pressable>
          </Link>
          <Pressable style={[styles.secondaryCta, styles.ctaRow]} onPress={toggleFavorite}>
            <Ionicons name={isFavorited ? 'checkmark' : 'add'} size={16} color="#fff" />
            <ThemedText style={styles.secondaryCtaText}>{isFavorited ? 'Saved' : 'My List'}</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 480,
    overflow: 'hidden',
    marginBottom: Spacing.three,
    backgroundColor: '#000',
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.three,
    backgroundColor: 'transparent',
    gap: 4,
  },
  tag: { color: '#C01918', fontWeight: '600', textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 26, lineHeight: 32 },
  excerpt: { color: '#e5e5e5', lineHeight: 20 },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
    backgroundColor: 'transparent',
  },
  ctaCombined: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaText: { color: '#000', fontWeight: '600', fontSize: 14 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondaryCta: {
    backgroundColor: 'rgba(120,120,120,0.4)',
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  secondaryCtaText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
