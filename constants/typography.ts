import { Platform } from 'react-native';

/** Inter weights loaded in app/_layout.tsx (custom fonts need one family per weight). */
export const Inter = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Type scale from the design's Tailwind config (font size / line height / tracking in px). */
export const Type = {
  displayLg: { fontFamily: Inter.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.8 },
  headlineLg: { fontFamily: Inter.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.48 },
  headlineMd: { fontFamily: Inter.semibold, fontSize: 20, lineHeight: 28, letterSpacing: -0.3 },
  bodyLg: { fontFamily: Inter.regular, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: Inter.regular, fontSize: 14, lineHeight: 20 },
  labelLg: { fontFamily: Inter.semibold, fontSize: 14, lineHeight: 20, letterSpacing: 0.14 },
  labelMd: { fontFamily: Inter.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
  labelSm: { fontFamily: Inter.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.44 },
} as const;

export type TypeVariant = keyof typeof Type;

export const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' }) as string;
