import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';

interface SectionHeaderProps {
  icon: IconName;
  title: string;
  /** Small text on the right (current selection, hint, "OpenRouter"...). */
  right?: string;
  rightTone?: 'textSecondary' | 'secondary' | 'primary';
  /** "form" = 14px label above a control, "section" = 20px heading (Settings). */
  size?: 'form' | 'section';
  iconColor?: 'primary' | 'error';
  uppercaseRight?: boolean;
}

export function SectionHeader({
  icon,
  title,
  right,
  rightTone = 'textSecondary',
  size = 'form',
  iconColor = 'primary',
  uppercaseRight = false,
}: SectionHeaderProps) {
  const section = size === 'section';
  return (
    <View style={[styles.row, section && styles.sectionRow]}>
      <View style={styles.left}>
        <Icon name={icon} size={section ? 20 : 18} color={iconColor} />
        <Txt variant={section ? 'headlineMd' : 'labelLg'}>{title}</Txt>
      </View>
      {right ? (
        <Txt
          variant={section ? 'labelSm' : 'labelMd'}
          color={rightTone}
          style={uppercaseRight && styles.upper}
          numberOfLines={1}
        >
          {right}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionRow: { paddingHorizontal: 4 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  upper: { textTransform: 'uppercase', letterSpacing: 1 },
});
