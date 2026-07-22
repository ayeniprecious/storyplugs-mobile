import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { TopNav } from '@/components/top-nav';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/context/categories-context';
import { useFavorite } from '@/hooks/use-favorite';
import { estimateReadMinutes } from '@/lib/read-time';
import { supabase } from '@/lib/supabase';
import type { Story } from '@/lib/database.types';

export function HeroBanner({ story }: { story: Story }) {
  const { user } = useAuth();
  const { isFavorited, toggle: toggleFavorite } = useFavorite(story.id);
  const { labels: categoryLabels } = useCategories();
  const readMinutes = estimateReadMinutes(story.body);

  // Same "Read Story / Continue Reading / Read Again" logic as the story
  // preview page -- the hero must never claim "Continue Reading" for a story
  // the user hasn't actually started.
  const [progress, setProgress] = useState<{ completed: boolean; percent: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.id) {
        setProgress(null);
        return;
      }
      const { data } = await supabase
        .from('story_views')
        .select('completed, progress_percent')
        .eq('user_id', user.id)
        .eq('story_id', story.id)
        .maybeSingle();
      if (!cancelled) {
        setProgress(data ? { completed: data.completed, percent: data.progress_percent } : null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [story.id, user?.id]);

  const completed = progress?.completed ?? false;
  const started = progress !== null && progress.percent > 0 && !completed;
  let ctaLabel = 'Read Story';
  if (completed) ctaLabel = 'Read Again';
  else if (started) ctaLabel = 'Continue Reading';

  return (
    <ThemedView style={styles.wrapper}>
      <TopNav title="Home" />

      <ThemedView style={styles.card}>
        {story.image_url && <Image source={{ uri: story.image_url }} style={styles.image} contentFit="cover" />}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.96)']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />

        <ThemedView style={styles.badge}>
          <Ionicons name="star" size={11} color="#C01918" />
          <ThemedText style={styles.badgeAccent}>STORY</ThemedText>
          <ThemedText style={styles.badgeRest}>OF THE DAY</ThemedText>
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
              <Ionicons name="pricetag-outline" size={13} color="rgba(255,255,255,0.75)" />
              <ThemedText style={styles.metaText}>
                {categoryLabels[story.category] ?? story.category}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.75)" />
              <ThemedText style={styles.metaText}>{readMinutes} min read</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.buttonRow}>
            <Link href={{ pathname: '/story/[id]', params: { id: story.id } }} asChild>
              <Pressable style={styles.primaryCta}>
                <Ionicons name="book-outline" size={14} color="#fff" />
                <ThemedText style={styles.primaryCtaText}>{ctaLabel}</ThemedText>
              </Pressable>
            </Link>
            <Pressable style={styles.secondaryCta} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorited ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color="#fff"
              />
              <ThemedText style={styles.secondaryCtaText}>{isFavorited ? 'Saved' : 'Save'}</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.three },
  card: {
    marginHorizontal: Spacing.two + 4,
    borderRadius: 24,
    overflow: 'hidden',
    height: 460,
    backgroundColor: '#1c1c1e',
  },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  badge: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeAccent: { color: '#C01918', fontWeight: '800', fontSize: 10, letterSpacing: 0.4 },
  badgeRest: { color: '#fff', fontWeight: '700', fontSize: 10, letterSpacing: 0.4 },
  bottomContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.three,
    gap: 8,
    backgroundColor: 'transparent',
  },
  title: { fontSize: 28, lineHeight: 33, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  excerpt: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.82)' },
  metaRow: { flexDirection: 'row', gap: Spacing.three, backgroundColor: 'transparent', marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'transparent' },
  metaText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.two,
    marginTop: Spacing.one,
    backgroundColor: 'transparent',
  },
  // No flex:1 -- sized to its own content only, pinned to the left, so it
  // never stretches or drifts on a wider screen the way a flexed button would.
  primaryCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C01918',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryCtaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryCtaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
