import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Tone = 'lowest' | 'low' | 'container' | 'high' | 'error';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Surface level from the design: lowest = white card, low/container/high = tinted panels. */
  tone?: Tone;
  radius?: number;
  padding?: number;
  /** Elevation from the design (cards use shadow-sm, the focal card shadow-md). */
  elevation?: 'none' | 'sm' | 'md';
}

export function Card({
  children,
  style,
  tone = 'lowest',
  radius = 12,
  padding = 16,
  elevation = 'sm',
}: CardProps) {
  const colors = Colors[useColorScheme()];
  const background = {
    lowest: colors.card,
    low: colors.containerLow,
    container: colors.container,
    high: colors.containerHigh,
    error: colors.errorContainer,
  }[tone];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: background, borderRadius: radius, padding },
        elevation === 'sm' && Shadows.sm,
        elevation === 'md' && Shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
});
