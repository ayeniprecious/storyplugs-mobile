import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useThemePrefs } from '@/context/theme-prefs-context';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { fontScale } = useThemePrefs();

  const typeStyle =
    (type === 'default' && styles.default) ||
    (type === 'title' && styles.title) ||
    (type === 'small' && styles.small) ||
    (type === 'smallBold' && styles.smallBold) ||
    (type === 'subtitle' && styles.subtitle) ||
    (type === 'link' && styles.link) ||
    (type === 'linkPrimary' && styles.linkPrimary) ||
    (type === 'code' && styles.code) ||
    undefined;

  // Scale whatever font size the type default or a caller's own style ends up producing,
  // so the global font-size setting affects every screen, not just unstyled text.
  const flattened = StyleSheet.flatten([typeStyle, style]);
  const baseFontSize = typeof flattened.fontSize === 'number' ? flattened.fontSize : 16;

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        typeStyle,
        style,
        { fontSize: baseFontSize * fontScale },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: 600,
    lineHeight: 44,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
