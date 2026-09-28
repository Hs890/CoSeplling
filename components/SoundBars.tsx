import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Colors, ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const BARS: { height: number; color: keyof ThemeColors; delay: number }[] = [
  { height: 8, color: 'primary', delay: 0 },
  { height: 20, color: 'primary', delay: 120 },
  { height: 12, color: 'secondary', delay: 240 },
  { height: 16, color: 'primary', delay: 360 },
  { height: 8, color: 'primaryContainer', delay: 480 },
  { height: 20, color: 'secondary', delay: 600 },
  { height: 12, color: 'primary', delay: 720 },
];

/** Little equaliser from the "Acoustic Audio Channel" card; animates while `active`. */
export function SoundBars({ active }: { active: boolean }) {
  const colors = Colors[useColorScheme()];
  const [values] = useState(() => BARS.map(() => new Animated.Value(1)));

  useEffect(() => {
    if (!active) {
      values.forEach((v) => v.setValue(1));
      return;
    }
    const loops = values.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(BARS[i].delay),
          Animated.timing(value, {
            toValue: 0.45,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 1,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, values]);

  return (
    <View style={styles.row}>
      {BARS.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            { height: bar.height, backgroundColor: colors[bar.color], transform: [{ scaleY: values[i] }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 20 },
  bar: { width: 4, borderRadius: 2 },
});
