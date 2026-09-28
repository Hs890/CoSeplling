import React, { useCallback, useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Icon, IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';

const VISIBLE_MS = 2500;

interface ToastState {
  message: string;
  icon: IconName;
  id: number;
}

/** Bottom pill notification from the Settings design. Render `toast` once in the screen. */
export function useToast() {
  const [state, setState] = useState<ToastState | null>(null);

  const show = useCallback((message: string, icon: IconName = 'check-circle') => {
    setState((prev) => ({ message, icon, id: (prev?.id ?? 0) + 1 }));
  }, []);
  const hide = useCallback(() => setState(null), []);

  const toast = state ? <ToastView key={state.id} message={state.message} icon={state.icon} onDone={hide} /> : null;
  return { show, toast };
}

function ToastView({ message, icon, onDone }: { message: string; icon: IconName; onDone: () => void }) {
  const colors = Colors[useColorScheme()];
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(VISIBLE_MS),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => animation.stop();
  }, [opacity, onDone]);

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View style={[styles.pill, { backgroundColor: colors.inverseSurface, opacity }, Shadows.md]}>
        <Icon name={icon} size={18} color={colors.secondaryFixed} />
        <Txt variant="labelMd" color="inverseOnSurface">
          {message}
        </Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
});
