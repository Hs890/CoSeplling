import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Icon, type IconName } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Txt } from '@/components/Txt';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message?: string;
  iconName?: IconName;
  actionLabel?: string;
  /** If provided, shows an action button navigating to this route */
  settingsHref?: string;
  onAction?: () => void;
  onClose: () => void;
  /** Confirm / destructive dialog support */
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmDanger?: boolean;
}

export function ErrorModal({
  visible,
  title,
  message,
  iconName = 'error-outline',
  actionLabel = 'Set API Key',
  settingsHref,
  onAction,
  onClose,
  confirmLabel,
  onConfirm,
  confirmDanger = false,
}: ErrorModalProps) {
  const colors = Colors[useColorScheme()];
  const router = useRouter();

  const handleAction = () => {
    onClose();
    if (onAction) {
      onAction();
    } else if (settingsHref) {
      router.push(settingsHref as any);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.outlineVariant }, Shadows.md]}
          onPress={() => {}}
        >
          {/* Icon Header */}
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

          {/* Actions */}
          <View style={styles.buttons}>
            <PrimaryButton
              label={onConfirm ? 'Cancel' : 'Dismiss'}
              variant="tonal"
              size="md"
              onPress={onClose}
              style={styles.button}
            />
            {onConfirm && (
              <PrimaryButton
                label={confirmLabel ?? 'Confirm'}
                variant={confirmDanger ? 'danger' : 'primary'}
                size="md"
                onPress={() => { onClose(); onConfirm(); }}
                style={styles.button}
              />
            )}
            {!onConfirm && (settingsHref || onAction) && (
              <PrimaryButton
                label={actionLabel}
                icon="settings"
                size="md"
                onPress={handleAction}
                style={styles.button}
              />
            )}
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
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headText: {
    flex: 1,
    gap: 4,
  },
  msg: {
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
  },
});
