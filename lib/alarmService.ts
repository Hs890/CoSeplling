import * as Notifications from 'expo-notifications';

// Clean up any remaining alarm notifications
Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

export interface AlarmConfig {
  enabled: boolean;
  label: string;
  time: string;
  period: 'AM' | 'PM';
  repeatDays: string[];
  customMusicUri: string | null;
  customMusicName: string | null;
  intervalHours: number | null;
}

export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function subscribeAlarmRinging(_listener: (isRinging: boolean) => void) {
  return () => {};
}

export async function triggerAlarmUI() {}

export function dismissAlarmUI() {}

export async function setupAlarmNotifications(): Promise<boolean> {
  return false;
}

export function startAlarmTicker() {
  return () => {};
}

export async function registerAlarmNotificationListeners() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
  return () => {};
}

export async function scheduleAlarmNotification(_cfg?: AlarmConfig): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function loadAlarmConfig(): Promise<AlarmConfig> {
  return {
    enabled: false,
    label: 'Alarm',
    time: '08:00',
    period: 'AM',
    repeatDays: [],
    customMusicUri: null,
    customMusicName: null,
    intervalHours: null,
  };
}

export async function saveAlarmConfig(_cfg: AlarmConfig): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function pickCustomAlarmAudio(): Promise<{ uri: string; name: string } | null> {
  return null;
}

export async function playAlarmAudio(_previewConfig?: AlarmConfig): Promise<void> {}

export async function stopAlarmAudio(): Promise<void> {}
