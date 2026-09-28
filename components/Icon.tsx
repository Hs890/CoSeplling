import React from 'react';
import type { ColorValue } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  /** A theme token name or a literal colour. */
  color?: keyof ThemeColors | (string & {}) | ColorValue;
}

/** Material icon coloured from the theme: white in dark mode, maroon in light mode by default. */
export function Icon({ name, size = 20, color = 'icon' }: IconProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];

  let resolved: ColorValue;
  if (color === 'primary' || color === 'icon') {
    resolved = colorScheme === 'dark' ? '#FFFFFF' : '#7A1428';
  } else if (typeof color === 'string' && color in palette) {
    resolved = palette[color as keyof ThemeColors] as ColorValue;
  } else {
    resolved = color as ColorValue;
  }

  return <MaterialIcons name={name} size={size} color={resolved} />;
}
