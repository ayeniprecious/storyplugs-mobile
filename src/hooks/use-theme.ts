/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useThemePrefs } from '@/context/theme-prefs-context';

export function useTheme() {
  const { resolvedScheme } = useThemePrefs();
  return Colors[resolvedScheme];
}
