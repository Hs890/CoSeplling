import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Icon, type IconName } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Txt } from '@/components/Txt';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  iconName?: IconName;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  iconName = 'delete-forever',
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const colors = Colors[useColorScheme()];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.outlineVariant }, Shadows.md]}
          onPress={() => {}}
        >
          <View style={styles.head}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
              <Icon name={iconName} size={24} color="primary" />
            </View>
            <View style={styles.headText}>
              <Txt variant="headlineMd" color="text">
                {title}
              </Txt>
              {message ? (
                <Txt variant="bodyMd" color="textSecondary" style={styles.msg}>
                  {message}
                </Txt>
              ) : null}
            </View>
          </View>

          <View style={styles.buttons}>
            <PrimaryButton
              label="Cancel"
              variant="tonal"
              size="md"
              onPress={onCancel}
              style={styles.button}
            />
            <PrimaryButton
              label={confirmLabel}
              icon="delete"
              size="md"
              onPress={onConfirm}
              style={styles.button}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 18,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  headText: {
    flex: 1,
    gap: 4,
  },
  msg: {
    lineHeight: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
  },
});
