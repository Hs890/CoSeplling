import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  variant?: 'default' | 'filled';
}

export function Chip({ label, selected = false, onPress, variant = 'default' }: ChipProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const backgroundColor = selected ? colors.tint : colors.background;
  const textColor = selected ? '#FFFFFF' : colors.text;
  const borderColor = colors.tint;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor,
            borderColor,
            borderWidth: selected ? 0 : 1,
          },
        ]}
      >
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    marginVertical: 6,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
