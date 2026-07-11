import { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

// How far below the fold (in px) a row can still be when its fade-in starts, so it's
// already comfortably faded in by the time it's fully scrolled into view rather than
// popping in abruptly right as it appears.
const REVEAL_MARGIN = 100;
const FADE_DURATION = 400;

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

  return { registerContainer, registerRow, handleScroll };
}
