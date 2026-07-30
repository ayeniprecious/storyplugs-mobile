import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCategories } from '@/context/categories-context';
import { useFavorite } from '@/hooks/use-favorite';
import type { Story } from '@/lib/database.types';
import { estimateReadMinutes } from '@/lib/read-time';

// Home's Short Stories row card -- the same visual language as HeroBanner
// (full-bleed image, bottom gradient, title/excerpt/meta/actions stacked at
// the bottom edge) just smaller and fixed-width so many sit in one endless
// horizontal row. Short stories are the one story type with a real
// image_url cover instead of a color card, hence the plain Image here
// rather than getCoverColor. Only the Read button navigates -- same
// interaction split as HeroBanner, where Save is its own tap target rather
// than the whole card being a link.
export function ShortStoryCard({
  story,
  style,
}: {
  story: Story;
  // Lets the View All page reuse this exact card full-width instead of the
  // fixed row width, without duplicating the whole component.
  style?: StyleProp<ViewStyle>;
}) {
  const { labels: categoryLabels } = useCategories();
  const { isFavorited, toggle: toggleFavorite } = useFavorite(story.id);
  const readMinutes = estimateReadMinutes(story.body);

  return (
    <View style={[styles.card, style]}>
      {story.image_url && (
        <Image source={{ uri: story.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.96)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ThemedView style={styles.badge}>
        <Ionicons name="book-outline" size={10} color="#C01918" />
        <ThemedText style={styles.badgeText}>SHORT STORY</ThemedText>
      </ThemedView>

      <ThemedView style={styles.bottomContent}>
        <ThemedText style={styles.title} numberOfLines={2}>
          {story.title}
        </ThemedText>
        <ThemedText style={styles.excerpt} numberOfLines={3}>
          {story.body}
        </ThemedText>

        <ThemedView style={styles.metaRow}>
          <ThemedView style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={11} color="rgba(255,255,255,0.75)" />
            <ThemedText style={styles.metaText} numberOfLines={1}>
              {categoryLabels[story.category] ?? story.category}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.metaItem}>
            <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.75)" />
            <ThemedText style={styles.metaText}>{readMinutes} min</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.buttonRow}>
          <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
            <Pressable style={styles.primaryCta}>
              <Ionicons name="book-outline" size={12} color="#fff" />
              <ThemedText style={styles.primaryCtaText}>Read</ThemedText>
            </Pressable>
          </Link>
          <Pressable style={styles.secondaryCta} onPress={toggleFavorite}>
            <Ionicons name={isFavorited ? 'bookmark' : 'bookmark-outline'} size={12} color="#fff" />
            <ThemedText style={styles.secondaryCtaText}>{isFavorited ? 'Saved' : 'Save'}</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    height: 300,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    justifyContent: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 8, letterSpacing: 0.3 },
  bottomContent: { padding: 12, gap: 5, backgroundColor: 'transparent' },
  title: { fontSize: 16, lineHeight: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  excerpt: { fontSize: 11, lineHeight: 15, color: 'rgba(255,255,255,0.82)' },
  metaRow: { flexDirection: 'row', gap: 10, backgroundColor: 'transparent', marginTop: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent', flexShrink: 1 },
  metaText: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '600' },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#C01918',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  primaryCtaText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  secondaryCtaText: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
