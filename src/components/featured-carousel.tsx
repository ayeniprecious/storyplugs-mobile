import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { FEATURED_CARD_WIDTH, FeaturedCard } from '@/components/featured-card';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Story } from '@/lib/database.types';

const CARD_GAP = Spacing.two;
const SNAP_INTERVAL = FEATURED_CARD_WIDTH + CARD_GAP;
const AUTO_ADVANCE_MS = 5000;

function CarouselCard({ story, index, scrollX }: { story: Story; index: number; scrollX: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SNAP_INTERVAL, index * SNAP_INTERVAL, (index + 1) * SNAP_INTERVAL];
    const scale = interpolate(scrollX.value, inputRange, [0.92, 1, 0.92], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.6, 1, 0.6], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  return (
    <Animated.View style={animatedStyle}>
      <FeaturedCard story={story} />
    </Animated.View>
  );
}

function Dot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SNAP_INTERVAL, index * SNAP_INTERVAL, (index + 1) * SNAP_INTERVAL];
    const width = interpolate(scrollX.value, inputRange, [6, 18, 6], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
    return { width, opacity };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function FeaturedCarousel({ stories }: { stories: Story[] }) {
  const scrollX = useSharedValue(0);
  const listRef = useRef<FlatList<Story>>(null);
  const indexRef = useRef(0);
  const [paused, setPaused] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Auto-advance for the streaming-app promo feel -- pauses the moment the
  // user touches the list and resumes once they let go, so it never fights
  // a manual swipe in progress.
  useEffect(() => {
    if (paused || stories.length <= 1) return;
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % stories.length;
      listRef.current?.scrollToOffset({ offset: indexRef.current * SNAP_INTERVAL, animated: true });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [paused, stories.length]);

  if (stories.length === 0) return null;

  return (
    <ThemedView style={styles.section}>
      <Animated.FlatList
        ref={listRef}
        data={stories}
        keyExtractor={(item) => (item as Story).id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onTouchStart={() => setPaused(true)}
        onMomentumScrollEnd={(e) => {
          indexRef.current = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
          setPaused(false);
        }}
        renderItem={({ item, index }) => <CarouselCard story={item as Story} index={index} scrollX={scrollX} />}
      />
      {stories.length > 1 && (
        <ThemedView style={styles.dotRow}>
          {stories.map((story, i) => (
            <Dot key={story.id} index={i} scrollX={scrollX} />
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two, marginBottom: Spacing.two },
  listContent: { gap: CARD_GAP, paddingRight: CARD_GAP },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: 'transparent' },
  dot: { height: 6, borderRadius: 3, backgroundColor: '#C01918' },
});
