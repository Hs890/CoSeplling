import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

// Foreground (app open hone par bhi) heads-up banner, sound aur alert popup show ho
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Android channel — fire-and-forget
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('alarm-channel', {
    name: 'Alarm & Reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    lightColor: '#007AFF',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  }).catch(() => {});
}

export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return status === 'granted';
  } catch {
    return true;
  }
}

export type RepeatMode = 'once' | 'daily' | 'custom_days' | 'interval' | 'specific_date';

export interface AlarmConfig {
  id?: string;
  label: string;
  hour: number;
  minute: number;
  mode: RepeatMode;
  selectedDays?: number[]; // 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
  intervalMinutes?: number;
  specificDate?: Date;
}

/**
 * Ab tak next fire hone wale seconds calculate karta hai
 */
function secondsUntil(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return Math.max(5, Math.floor((target.getTime() - now.getTime()) / 1000));
}

/**
 * Next matching weekday tak seconds calculate karta hai
 * weekday: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
 */
function secondsUntilWeekday(weekday: number, hour: number, minute: number): number {
  const now = new Date();
  const jsDay = weekday === 1 ? 0 : weekday - 1; // Convert to JS day (0=Sun)
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  const currentDay = now.getDay(); // 0=Sun
  let daysAhead = jsDay - currentDay;
  if (daysAhead < 0 || (daysAhead === 0 && target.getTime() <= now.getTime())) {
    daysAhead += 7;
  }
  target.setDate(target.getDate() + daysAhead);
  return Math.max(5, Math.floor((target.getTime() - now.getTime()) / 1000));
}

/**
 * Local alarm schedule karta hai — 100% on-device, no backend
 */
export async function scheduleAlarm(config: AlarmConfig): Promise<string[]> {
  const { label, hour, minute, mode, selectedDays, intervalMinutes, specificDate } = config;
  const ids: string[] = [];
  const channelId = Platform.OS === 'android' ? 'alarm-channel' : undefined;

  const baseContent: Notifications.NotificationContentInput = {
    title: `⏰ ${label || 'Alarm'}`,
    body: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} — Alarm!`,
    sound: 'default',
    priority: 'high',
    ...(Platform.OS === 'android' && { vibrate: [0, 500, 250, 500] }),
  };

  // SPECIFIC DATE
  if (mode === 'specific_date' && specificDate) {
    const target = new Date(specificDate);
    target.setHours(hour, minute, 0, 0);
    const secsUntil = Math.max(5, Math.floor((target.getTime() - Date.now()) / 1000));
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        ...baseContent,
        body: `${target.toLocaleDateString()} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} — Alarm!`,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secsUntil,
        repeats: false,
        ...(channelId && { channelId }),
      },
    });
    ids.push(id);
    return ids;
  }

  // INTERVAL REPEAT
  if (mode === 'interval' && intervalMinutes && intervalMinutes > 0) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        ...baseContent,
        body: `Har ${intervalMinutes} min baad: ${label || 'Reminder'}`,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: intervalMinutes * 60,
        repeats: true,
        ...(channelId && { channelId }),
      },
    });
    ids.push(id);
    return ids;
  }

  // DAILY
  if (mode === 'daily') {
    const secs = secondsUntil(hour, minute);
    const id = await Notifications.scheduleNotificationAsync({
      content: baseContent,
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secs,
        repeats: true,
        ...(channelId && { channelId }),
      },
    });
    ids.push(id);
    return ids;
  }

  // CUSTOM DAYS
  if (mode === 'custom_days' && selectedDays && selectedDays.length > 0) {
    for (const weekday of selectedDays) {
      const secs = secondsUntilWeekday(weekday, hour, minute);
      const id = await Notifications.scheduleNotificationAsync({
        content: baseContent,
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secs,
          repeats: true,
          ...(channelId && { channelId }),
        },
      });
      ids.push(id);
    }
    return ids;
  }

  // ONCE
  const secs = secondsUntil(hour, minute);
  const id = await Notifications.scheduleNotificationAsync({
    content: baseContent,
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secs,
      repeats: false,
      ...(channelId && { channelId }),
    },
  });
  ids.push(id);
  return ids;
}

/**
 * 5-second test alarm
 */
export async function scheduleTestAlarm(seconds = 5): Promise<string> {
  const channelId = Platform.OS === 'android' ? 'alarm-channel' : undefined;
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Test Alarm!',
      body: 'Local alarm kaam kar raha hai!',
      sound: 'default',
      priority: 'high',
      ...(Platform.OS === 'android' && { vibrate: [0, 500, 250, 500] }),
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
      ...(channelId && { channelId }),
    },
  });
}

export async function cancelAlarm(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

export async function cancelAllAlarms(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export async function getScheduledAlarms(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}
