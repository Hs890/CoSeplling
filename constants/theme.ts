/**
 * "IELTS Academic Focus" palette taken from the Stitch export
 * (assets/stitch_ielts_spelling_practice_app/*, Tailwind config in each code.html).
 * Token names follow Material 3 (surface containers, primary/secondary/error roles).
 * The dark palette is a matching variant; the design itself is light-only.
 */

import { Platform } from 'react-native';

const base = {
  // ── Text ──────────────────────────────────────────────────────────
  text: '#FFFFFF',            // pure white — main text
  textSecondary: '#FFFFFF',   // white secondary text
  outline: '#FFFFFF',         // white outline
  outlineVariant: '#2A2A2A',  // dark dividers

  // ── Surfaces (all black-based) ────────────────────────────────────
  background: '#080808',      // near-pure black
  card: '#110A0A',            // dark maroon-tinted black
  containerLow: '#190E0E',    // dark
  container: '#201212',       // slightly lighter dark
  containerHigh: '#2A1616',   // visible dark brown-black
  containerHighest: '#361C1C',// darkest container

  // ── Primary: exact user maroon #7A1428 ──────────────────────────────
  primary: '#7A1428',         // exact maroon — buttons, accents
  onPrimary: '#FFFFFF',       // white text on maroon button
  primaryContainer: '#500D1A',
  onPrimaryContainer: '#FFFFFF', // white text on maroon container
  primaryFixed: '#24060C',
  primaryFixedDim: '#3E0A14',

  // ── Secondary: deep maroon #6B1223 ─────────────────────────────────
  secondary: '#6B1223',       // deep maroon secondary
  onSecondary: '#FFFFFF',
  secondaryContainer: '#500D1A',
  onSecondaryContainer: '#FFFFFF', // white text on secondary container
  secondaryFixed: '#3E0A14',
  onSecondaryFixed: '#FFFFFF',

  // ── Error: #6B1223 ─────────────────────────────────────────────────
  error: '#6B1223',
  onError: '#FFFFFF',
  errorContainer: '#3E0A14',
  onErrorContainer: '#FFFFFF', // white text on error container

  // ── Misc ──────────────────────────────────────────────────────────
  tertiaryFixed: '#2E1010',
  onTertiaryFixed: '#FFFFFF',
  inverseSurface: '#FFFFFF',
  inverseOnSurface: '#080808',

  // ── Aliases ───────────────────────────────────────────────────────
  tint: '#7A1428',
  icon: '#FFFFFF',
  tabIconDefault: '#FFFFFF',
  tabIconSelected: '#7A1428',
};

const dark = { ...base };

const light: typeof base = {
  // ── Text ──────────────────────────────────────────────────────────
  text: '#000000',            // pure black
  textSecondary: '#1A1A1A',   // rich dark black
  outline: '#7A1428',         // maroon
  outlineVariant: '#E5E7EB',  // subtle divider

  // ── Surfaces ──────────────────────────────────────────────────────
  background: '#FFFFFF',      // clean pure white
  card: '#FFFFFF',            // pure white
  containerLow: '#F7F7F8',    // very light clean container
  container: '#EFEFEF',       // light container
  containerHigh: '#FDE8EC',   // soft maroon-tinted container
  containerHighest: '#F5D6DC',

  // ── Primary: exact user maroon #7A1428 ──────────────────────────────
  primary: '#7A1428',         // exact maroon
  onPrimary: '#FFFFFF',
  primaryContainer: '#F5D6DC',
  onPrimaryContainer: '#7A1428',
  primaryFixed: '#F5D6DC',
  primaryFixedDim: '#ECC4CC',

  // ── Secondary: deep maroon #6B1223 ─────────────────────────────────
  secondary: '#6B1223',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FDE8EC',
  onSecondaryContainer: '#7A1428',
  secondaryFixed: '#FDE8EC',
  onSecondaryFixed: '#7A1428',

  // ── Error ─────────────────────────────────────────────────────────
  error: '#6B1223',
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#7A1428',

  // ── Misc ──────────────────────────────────────────────────────────
  tertiaryFixed: '#FDE8EC',
  onTertiaryFixed: '#7A1428',
  inverseSurface: '#000000',
  inverseOnSurface: '#FFFFFF',

  // ── Aliases ───────────────────────────────────────────────────────
  tint: '#7A1428',
  icon: '#7A1428',
  tabIconDefault: '#7A1428',
  tabIconSelected: '#7A1428',
};

export const Colors = { light, dark };

export type ThemeColors = typeof light;


/** Soft elevation from the design: shadow-sm / shadow-md. */
export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
