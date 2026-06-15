import { TextStyle } from 'react-native';

import { colors } from './colors';

export const typography = {
  brand: {
    fontSize: 32,
    fontWeight: '800' as TextStyle['fontWeight'],
    color: colors.primary,
  },
  h1: {
    fontSize: 24,
    fontWeight: '800' as TextStyle['fontWeight'],
    color: colors.textDark,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: colors.textDark,
  },
  h3: {
    fontSize: 16,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: colors.textDark,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: colors.textDark,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: colors.textMuted,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: colors.textDark,
  },
};
