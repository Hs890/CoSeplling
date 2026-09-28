import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Icon, IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';

type Variant =
  | 'primary'
  | 'primaryContainer'
  | 'secondary'
  | 'success'
  | 'tonal'
  | 'danger'
  | 'dangerSoft'
  | 'ghost';
type Size = 'lg' | 'md' | 'sm';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  variant?: Variant;
  /** lg: 56px hero action, md: 48px, sm: 44px. */
  size?: Size;
  style?: StyleProp<ViewStyle>;
}

const SIZES = {
  lg: { height: 56, borderRadius: 16, iconSize: 22 },
  md: { height: 48, borderRadius: 12, iconSize: 18 },
  sm: { height: 44, borderRadius: 12, iconSize: 18 },
} as const;

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  variant = 'primary',
  size = 'lg',
  style,
}: PrimaryButtonProps) {
  const colors = Colors[useColorScheme()];

  const looks = {
    primary: { bg: colors.primary, fg: colors.onPrimary, shadow: true },
    primaryContainer: { bg: colors.primaryContainer, fg: colors.onPrimary, shadow: true },
    secondary: { bg: colors.card, fg: colors.text, shadow: true },
    success: { bg: colors.secondary, fg: colors.onSecondary, shadow: true },
    tonal: { bg: colors.containerHigh, fg: colors.text, shadow: false },
    danger: { bg: colors.error, fg: colors.onError, shadow: true },
    dangerSoft: { bg: colors.container, fg: colors.error, shadow: false },
    ghost: { bg: 'transparent', fg: colors.textSecondary, shadow: false },
  }[variant];
  const dims = SIZES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { height: dims.height, borderRadius: dims.borderRadius, backgroundColor: looks.bg },
        looks.shadow && (size === 'lg' ? Shadows.md : Shadows.sm),
        {
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !disabled ? 0.99 : 1 }],
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={dims.iconSize} color={looks.fg} /> : null}
        <Txt variant={size === 'lg' ? 'labelLg' : 'labelMd'} color={looks.fg} style={size !== 'lg' && styles.semibold}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  semibold: { fontFamily: 'Inter_600SemiBold' },
});
