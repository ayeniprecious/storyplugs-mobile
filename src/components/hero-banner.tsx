import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { TopNav } from '@/components/top-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardAsh, Spacing } from '@/constants/theme';
import { useCategories } from '@/context/categories-context';
import { useFavorite } from '@/hooks/use-favorite';
import { useTheme } from '@/hooks/use-theme';
import type { Story } from '@/lib/database.types';

export function HeroBanner({ story }: { story: Story }) {
  const { isFavorited, toggle: toggleFavorite } = useFavorite(story.id);
  const { labels: categoryLabels } = useCategories();
  const theme = useTheme();

  return (
    <ThemedView style={styles.wrapper}>
      <TopNav title="Home" />

      <ThemedView style={styles.shadowWrap}>
        <ThemedView style={styles.card}>
          <ThemedView style={styles.imageWrap}>
            {story.image_url && <Image source={{ uri: story.image_url }} style={styles.image} contentFit="cover" />}
            <ThemedView style={styles.floatingPill}>
              <ThemedView style={styles.liveDot} />
              <ThemedText style={styles.floatingPillText}>FEATURED TODAY</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.infoPanel}>
            <ThemedText type="small" style={styles.tag}>
              {(categoryLabels[story.category] ?? story.category).toUpperCase()}
            </ThemedText>
            <ThemedText style={styles.title} numberOfLines={2}>
              {story.title}
            </ThemedText>
            <ThemedText type="small" style={styles.excerpt} numberOfLines={2}>
              {story.body}
            </ThemedText>
            <ThemedView style={styles.buttonRow}>
              <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
                <Pressable style={styles.primaryCta}>
                  <Ionicons name="book-outline" size={16} color="#fff" />
                  <ThemedText style={styles.primaryCtaText}>Read Full Story</ThemedText>
                </Pressable>
              </Link>
              <Pressable style={[styles.secondaryCta, { borderColor: theme.border }]} onPress={toggleFavorite}>
                <Ionicons
                  name={isFavorited ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={isFavorited ? '#C01918' : theme.text}
                />
                <ThemedText style={styles.secondaryCtaText}>{isFavorited ? 'Saved' : 'Save'}</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.three },
  shadowWrap: {
    marginHorizontal: Spacing.two + 4,
    borderRadius: 26,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { boxShadow: '0 12px 28px rgba(0,0,0,0.28)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
        elevation: 8,
      },
    }),
  },
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: CardAsh,
  },
  imageWrap: { backgroundColor: 'transparent' },
  image: { width: '100%', height: 200, backgroundColor: '#1c1c1e' },
  floatingPill: {
    position: 'absolute',
    left: Spacing.three,
    bottom: -14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C01918' },
  floatingPillText: { color: '#fff', fontWeight: '700', fontSize: 10, letterSpacing: 0.6 },
  infoPanel: { padding: Spacing.three, paddingTop: Spacing.four, gap: 6 },
  tag: { color: '#C01918', fontWeight: '700', fontSize: 11, letterSpacing: 0.4 },
  title: { fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.3 },
  excerpt: { opacity: 0.7, lineHeight: 19 },
  buttonRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  primaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#700a0a',
    borderRadius: 999,
    paddingVertical: Spacing.two + 2,
  },
  primaryCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  secondaryCtaText: { fontWeight: '600', fontSize: 14 },
});
