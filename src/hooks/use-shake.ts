import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Total acceleration magnitude (in g) above which we call it a shake --
// normal handheld jitter/walking sits well under 2, a deliberate shake spikes
// well past it.
const SHAKE_THRESHOLD = 2.2;
// Ignore further readings for a bit after one shake fires, so a single
// physical shake (several accelerometer samples in a row) only triggers once.
const SHAKE_COOLDOWN_MS = 2000;

export function useShake(onShake: () => void, enabled: boolean) {
  const lastShakeAt = useRef(0);
  // Ref instead of an effect dependency so a re-render that only changes the
  // callback identity doesn't tear down and resubscribe the accelerometer.
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  useEffect(() => {
    // expo-sensors' web Accelerometer module never implements addListener --
    // unlike its sibling methods (setUpdateInterval, isAvailableAsync, etc.),
    // DeviceSensor.addListener() has no existence check before calling
    // straight through to it, so on web this throws synchronously and takes
    // the whole app down. There's no real accelerometer to shake on a desktop
    // browser anyway, so just don't subscribe there.
    if (!enabled || Platform.OS === "web") return;

    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (magnitude > SHAKE_THRESHOLD && now - lastShakeAt.current > SHAKE_COOLDOWN_MS) {
        lastShakeAt.current = now;
        onShakeRef.current();
      }
    });

    return () => subscription.remove();
  }, [enabled]);
}
