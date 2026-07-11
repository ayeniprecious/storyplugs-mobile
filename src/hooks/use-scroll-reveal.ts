import { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

// Negative means the row must already be a little way into the viewport before it starts
// fading in -- with a positive margin the whole fade could finish while still off-screen
// (invisible to the user), especially combined with a longer duration.
const REVEAL_MARGIN = -40;
const FADE_DURATION = 700;

interface RowEntry {
  rawY: number;
  containerId?: string;
}

export function useScrollReveal() {
  const opacities = useRef(new Map<string, Animated.Value>()).current;
  const rows = useRef(new Map<string, RowEntry>()).current;
  const containerOffsets = useRef(new Map<string, number>()).current;
  const revealed = useRef(new Set<string>()).current;

  const getOpacity = useCallback(
    (id: string) => {
      if (!opacities.has(id)) opacities.set(id, new Animated.Value(0));
      return opacities.get(id)!;
    },
    [opacities]
  );

  // onLayout's y is only relative to the immediate parent, not the scroll content root, so a
  // row's true offset is its container's own offset plus its raw y -- computed lazily here
  // (rather than baked in once) so it's correct however the parent/child onLayout events end
  // up interleaved.
  const trueOffset = useCallback(
    (entry: RowEntry) => {
      const base = entry.containerId ? (containerOffsets.get(entry.containerId) ?? 0) : 0;
      return base + entry.rawY;
    },
    [containerOffsets]
  );

  const reveal = useCallback(
    (scrollY: number, viewportHeight: number) => {
      rows.forEach((entry, id) => {
        if (revealed.has(id)) return;
        if (scrollY + viewportHeight + REVEAL_MARGIN >= trueOffset(entry)) {
          revealed.add(id);
          Animated.timing(getOpacity(id), {
            toValue: 1,
            duration: FADE_DURATION,
            useNativeDriver: true,
          }).start();
        }
      });
    },
    [rows, revealed, getOpacity, trueOffset]
  );

  const registerContainer = useCallback(
    (id: string) => ({
      onLayout: (e: LayoutChangeEvent) => {
        containerOffsets.set(id, e.nativeEvent.layout.y);
        // Rows registered before this container's own offset was known were skipped below --
        // now that it's here, re-check everything with correct, comparable offsets.
        reveal(0, Dimensions.get('window').height);
      },
    }),
    [containerOffsets, reveal]
  );

  const registerRow = useCallback(
    (id: string, containerId?: string) => ({
      style: { opacity: getOpacity(id) },
      onLayout: (e: LayoutChangeEvent) => {
        rows.set(id, { rawY: e.nativeEvent.layout.y, containerId });
        // Skip the check until the container's own offset is known -- otherwise this would
        // treat the row as if it had no container (offset understated), risking a premature,
        // permanent reveal that a later correction can no longer undo.
        if (!containerId || containerOffsets.has(containerId)) {
          reveal(0, Dimensions.get('window').height);
        }
      },
    }),
    [rows, containerOffsets, getOpacity, reveal]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      reveal(e.nativeEvent.contentOffset.y, e.nativeEvent.layoutMeasurement.height);
    },
    [reveal]
  );

  // Also catch rows already in view before any layout/scroll event has fired at all.
  useEffect(() => {
    reveal(0, Dimensions.get('window').height);
  }, [reveal]);

  // FlatList-specific: a virtualized cell's onLayout reports position relative to its own
  // cell wrapper (always 0), so the manual offset math above doesn't apply inside one.
  // FlatList's own viewability tracking is the correct tool for exactly this instead.
  const getRowOpacity = getOpacity;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ key: string; isViewable: boolean }> }) => {
      viewableItems.forEach(({ key, isViewable }) => {
        if (!isViewable || revealed.has(key)) return;
        revealed.add(key);
        Animated.timing(getOpacity(key), {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }).start();
      });
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 15 }).current;

  return {
    registerContainer,
    registerRow,
    handleScroll,
    getRowOpacity,
    onViewableItemsChanged,
    viewabilityConfig,
  };
}
