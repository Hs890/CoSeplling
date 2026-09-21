import { Alert, AlertButton } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  if (!visible) return null;

  const buttons: AlertButton[] = [
    {
      text: 'Cancel',
      onPress: onCancel,
      style: 'cancel',
    },
    {
      text: destructive ? 'Delete' : 'Confirm',
      onPress: onConfirm,
      style: destructive ? 'destructive' : 'default',
    },
  ];

  Alert.alert(title, message, buttons);
  return null;
}
