import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type ThemeMode = "system" | "light" | "dark";
export type FontScaleKey = "small" | "medium" | "large" | "xlarge";

export const FONT_SCALES: Record<FontScaleKey, number> = {
  small: 0.9,
  medium: 1,
  large: 1.15,
  xlarge: 1.3,
};

const THEME_STORAGE_KEY = "storyplugs.themeMode";
const FONT_STORAGE_KEY = "storyplugs.fontScale";

interface ThemePrefsValue {
  themeMode: ThemeMode;
  resolvedScheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  fontScaleKey: FontScaleKey;
  fontScale: number;
  setFontScaleKey: (key: FontScaleKey) => void;
}

const ThemePrefsContext = createContext<ThemePrefsValue | null>(null);

export function ThemePrefsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [fontScaleKey, setFontScaleKeyState] = useState<FontScaleKey>("medium");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeModeState(stored);
      }
    });
    AsyncStorage.getItem(FONT_STORAGE_KEY).then((stored) => {
      if (stored && stored in FONT_SCALES) {
        setFontScaleKeyState(stored as FontScaleKey);
      }
    });
  }, []);

  function setThemeMode(mode: ThemeMode) {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }

  function setFontScaleKey(key: FontScaleKey) {
    setFontScaleKeyState(key);
    AsyncStorage.setItem(FONT_STORAGE_KEY, key);
  }

  const resolvedScheme: "light" | "dark" =
    themeMode === "system" ? (systemScheme === "dark" ? "dark" : "light") : themeMode;

  const value = useMemo(
    () => ({
      themeMode,
      resolvedScheme,
      setThemeMode,
      fontScaleKey,
      fontScale: FONT_SCALES[fontScaleKey],
      setFontScaleKey,
    }),
    [themeMode, resolvedScheme, fontScaleKey]
  );

  return <ThemePrefsContext.Provider value={value}>{children}</ThemePrefsContext.Provider>;
}

export function useThemePrefs() {
  const ctx = useContext(ThemePrefsContext);
  if (!ctx) throw new Error("useThemePrefs must be used within ThemePrefsProvider");
  return ctx;
}
