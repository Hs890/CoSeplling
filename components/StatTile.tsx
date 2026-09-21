import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StatTileProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatTile({ label, value, color }: StatTileProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.tile, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#F0F0F0' }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.value, { color: color || colors.tint }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 6,
    marginVertical: 6,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
});
