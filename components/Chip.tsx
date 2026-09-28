import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Txt } from '@/components/Txt';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** xl: category chips, lg: duration/interval chips, full: filter pills. */
  shape?: 'xl' | 'lg' | 'full';
  /** Filter pills use primary-container when selected, the rest use primary. */
  selectedTone?: 'primary' | 'primaryContainer';
}

const SHAPES = {
  xl: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  lg: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  full: { borderRadius: 9999, paddingVertical: 6, paddingHorizontal: 12 },
} as const;

export function Chip({ label, selected = false, onPress, shape = 'lg', selectedTone = 'primary' }: ChipProps) {
  const colors = Colors[useColorScheme()];
  const selectedBg = selectedTone === 'primary' ? colors.primary : colors.primaryContainer;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        SHAPES[shape],
        { backgroundColor: selected ? selectedBg : colors.card },
        Shadows.sm,
      ]}
    >
      <Txt variant="labelMd" color={selected ? 'onPrimary' : 'textSecondary'}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
