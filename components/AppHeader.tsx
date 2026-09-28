import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** Tab screens center the title; pushed screens show a back arrow on the left. */
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function AppHeader({ title, subtitle, onBack, rightAction }: AppHeaderProps) {
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: colors.background,
          borderBottomColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.row}>
        {/* Left: back button OR spacer */}
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.sideSlot, styles.backBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <Icon name="arrow-back-ios-new" size={20} color="primary" />
          </Pressable>
        ) : (
          <View style={styles.sideSlot} />
        )}

        {/* Center: title (always centered) */}
        <View style={styles.titleWrap}>
          <Txt variant="headlineMd" numberOfLines={1} color="text" style={styles.headerTitle}>
            {title}
          </Txt>
          {subtitle && (
            <Txt variant="labelSm" color="textSecondary" numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Txt>
          )}
        </View>

        {/* Right: custom action OR empty spacer (no avatar) */}
        <View style={styles.sideSlot}>
          {rightAction ?? null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  row: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideSlot: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    height: 36,
    borderRadius: 18,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
