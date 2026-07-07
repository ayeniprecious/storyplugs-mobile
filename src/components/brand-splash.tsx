import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

interface BrandSplashProps {
  /** Flip to true when the app is ready — the splash fades out, then calls onHidden. */
  done: boolean;
  onHidden: () => void;
}

/**
 * Branded splash page shown on cold start. The native splash hands off to this
 * immediately; the root layout keeps it visible for a minimum duration and until
 * auth/profile have resolved, then flips `done` to fade it out over the app.
 */
export function BrandSplash({ done, onHidden }: BrandSplashProps) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(textShift, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [logoOpacity, logoScale, textOpacity, textShift]);

  useEffect(() => {
    if (!done) return;
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 450,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onHidden();
    });
  }, [done, containerOpacity, onHidden]);

  return (
    <Animated.View
      pointerEvents={done ? "none" : "auto"}
      style={[StyleSheet.absoluteFill, { opacity: containerOpacity }]}
    >
      <LinearGradient colors={["#2a070b", "#000000"]} style={styles.gradient}>
        <Animated.Image
          source={require("@/assets/images/logo-mark.png")}
          style={[
            styles.logoMark,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
          resizeMode="contain"
        />
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: textOpacity, transform: [{ translateY: textShift }] },
          ]}
        >
          Plugging Stories Into The World
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoMark: { width: 180, height: 180, marginBottom: 8 },
  tagline: { color: "rgba(255,255,255,0.65)", fontSize: 15, marginTop: 8 },
});
