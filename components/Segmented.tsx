import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Txt } from '@/components/Txt';

interface SegmentedProps<T extends string> {
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

/** Equal-width pill selector on a container-low track (difficulty in the design). */
export function Segmented<T extends string>({ options, selected, onSelect, style }: SegmentedProps<T>) {
  const colors = Colors[useColorScheme()];

  return (
    <View style={[styles.track, { backgroundColor: colors.containerLow }, style]}>
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[styles.option, isSelected && [{ backgroundColor: colors.card }, Shadows.sm]]}
          >
            <Txt
              variant="labelMd"
              color={isSelected ? 'primary' : 'textSecondary'}
              style={isSelected && styles.selectedLabel}
              numberOfLines={1}
            >
              {option}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 4, borderRadius: 12, gap: 8 },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  selectedLabel: { fontFamily: 'Inter_600SemiBold' },
});
