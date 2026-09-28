import React from 'react';
import { Text, TextProps } from 'react-native';
import { Colors, ThemeColors } from '@/constants/theme';
import { Type, TypeVariant } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TxtProps extends TextProps {
  variant?: TypeVariant;
  /** A theme token name (e.g. "textSecondary") or a literal colour. */
  color?: keyof ThemeColors | (string & {});
}

/**
 * Text color remapping: primary/secondary/error when used as text
 * should render white (or near-white) — maroon/red is for backgrounds only.
 */
const TEXT_COLOR_REMAP: Partial<Record<keyof ThemeColors, keyof ThemeColors>> = {
  primary: 'text',
  secondary: 'text',
  error: 'textSecondary',
};

/** Text using the design's Inter type scale and theme colours. */
export function Txt({ variant = 'bodyMd', color = 'text', style, ...rest }: TxtProps) {
  const palette = Colors[useColorScheme()];
  const remapped = (color in TEXT_COLOR_REMAP
    ? TEXT_COLOR_REMAP[color as keyof ThemeColors]!
    : color) as keyof ThemeColors | string;
  const resolved = remapped in palette ? palette[remapped as keyof ThemeColors] : remapped;
  return <Text {...rest} style={[Type[variant], { color: resolved }, style]} />;
}
