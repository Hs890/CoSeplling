import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  cancelAlarm,
  cancelAllAlarms,
  getScheduledAlarms,
  RepeatMode,
  scheduleAlarm,
  scheduleTestAlarm,
} from '@/utils/notifications';

const DAYS_OF_WEEK = [
  { id: 2, label: 'Mon' },
  { id: 3, label: 'Tue' },
  { id: 4, label: 'Wed' },
  { id: 5, label: 'Thu' },
  { id: 6, label: 'Fri' },
  { id: 7, label: 'Sat' },
  { id: 1, label: 'Sun' },
];

const PRESET_LABELS = ['🌅 Wake Up', '💊 Medicine', '💧 Drink Water', '🕌 Prayer', '💼 Meeting', '🏃 Workout'];
const INTERVAL_OPTIONS = [15, 30, 45, 60, 120];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // High-contrast and modern palette
  const accent = isDark ? '#0A84FF' : '#007AFF';
  const textColor = isDark ? '#FFFFFF' : '#11181C';
  const subTextColor = isDark ? '#A1A1A6' : '#6C6C70';
  const bgColor = isDark ? '#121214' : '#F5F5F7';
  const cardBg = isDark ? '#1E1E20' : '#FFFFFF';
  const innerCardBg = isDark ? '#2A2A2E' : '#F0F0F3';
  const borderColor = isDark ? '#3A3A3E' : '#E0E0E6';

  // Form State
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return d;
  });
  const [label, setLabel] = useState('Wake Up');
  const [mode, setMode] = useState<RepeatMode>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 3, 4, 5, 6]); // Mon-Fri
  const [intervalMinutes, setIntervalMinutes] = useState<number>(30);
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [pickerType, setPickerType] = useState<'time' | 'date'>('time');

  // Active alarms list
  const [alarms, setAlarms] = useState<Notifications.NotificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock ticker for live display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAlarms = useCallback(async () => {
    try {
      const scheduled = await getScheduledAlarms();
      setAlarms(scheduled);
    } catch (e) {
      console.error('Failed to get scheduled alarms', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAlarms();
    }, [loadAlarms])
  );

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowNativePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) {
        Alert.alert('Selection', 'Kam az kam ek din select rehna zaroori hai.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleSetAlarm = async () => {
    if (!label.trim()) {
      Alert.alert('Label Missing', 'Alarm ya reminder ke liye ek naam daalein.');
      return;
    }

    setLoading(true);
    try {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();

      await scheduleAlarm({
        hour,
        minute,
        label: label.trim(),
        mode,
        selectedDays: mode === 'custom_days' ? selectedDays : undefined,
        intervalMinutes: mode === 'interval' ? intervalMinutes : undefined,
        specificDate: mode === 'specific_date' ? selectedDate : undefined,
      });

      await loadAlarms();

      let modeText = 'Sirf ek baar';
      if (mode === 'daily') modeText = 'Har roz repeat hoga';
      if (mode === 'custom_days') modeText = `${selectedDays.length} din repeat hoga`;
      if (mode === 'interval') modeText = `Har ${intervalMinutes} minute baad repeat hoga`;
      if (mode === 'specific_date') modeText = `${selectedDate.toLocaleDateString()} ko trigger hoga`;

      Alert.alert(
        '✅ Alarm Scheduled!',
        `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} — ${label.trim()}\n${modeText}`
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Alarm schedule nahi ho saka.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = async () => {
    try {
      await scheduleTestAlarm(10);
      Alert.alert('⏱️ Test Alarm Set!', '10 seconds mein notification aayegi. Phone lock karke ya background me check karein!');
      await loadAlarms();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Test trigger failed');
    }
  };

  const handleCancelOne = (id: string, title: string) => {
    Alert.alert('Cancel Alarm?', title, [
      { text: 'Nahi', style: 'cancel' },
      {
        text: 'Haan, Delete Karo',
        style: 'destructive',
        onPress: async () => {
          await cancelAlarm(id);
          await loadAlarms();
        },
      },
    ]);
  };

  const handleCancelAll = () => {
    if (alarms.length === 0) return;
    Alert.alert('Sab Alarms Delete?', `${alarms.length} scheduled alarms cancel ho jayenge.`, [
      { text: 'Nahi', style: 'cancel' },
      {
        text: 'Haan, Sab Delete Karo',
        style: 'destructive',
        onPress: async () => {
          await cancelAllAlarms();
          await loadAlarms();
        },
      },
    ]);
  };

  const formatTriggerDetails = (trigger: Notifications.NotificationTrigger | null): string => {
    if (!trigger) return 'Active';
    const t = trigger as any;
    if (t.type === 'daily') {
      return `🔁 Har roz ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
    }
    if (t.type === 'weekly') {
      const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `📅 Har ${dayNames[t.weekday] || 'Day'} ko ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
    }
    if (t.type === 'timeInterval') {
      const mins = Math.round(t.seconds / 60);
      return `⏳ Interval: Har ${mins} min baad`;
    }
    if (t.type === 'date') {
      const d = t.value ? new Date(t.value) : t.date ? new Date(t.date) : null;
      return d ? `⏰ ${d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Ek baar';
    }
    return 'Scheduled';
  };

  const hour = selectedDate.getHours();
  const minute = selectedDate.getMinutes();
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* ── HEADER ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: textColor }]}>⏰ Smart Alarm</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Live: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.testBadge, { borderColor: accent, backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)' }]}
          onPress={handleQuickTest}>
          <Text style={[styles.testBadgeText, { color: accent }]}>⚡ Test 5s</Text>
        </TouchableOpacity>
      </View>

      {/* ── TIME DISPLAY / PICKER CARD ── */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionLabel, { color: subTextColor }]}>SET TIME</Text>

        <TouchableOpacity
          style={[styles.bigTimeContainer, { backgroundColor: innerCardBg, borderColor }]}
          onPress={() => {
            setPickerType('time');
            setShowNativePicker(true);
          }}
          activeOpacity={0.75}>
          <Text style={[styles.bigTimeText, { color: textColor }]}>
            {pad(hour)}:{pad(minute)}
          </Text>
          <View style={[styles.tapBadge, { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.12)' }]}>
            <Text style={[styles.tapToChange, { color: accent }]}>🕒 Tap to change time</Text>
          </View>
        </TouchableOpacity>

        {/* Native DateTimePicker */}
        {showNativePicker && (
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={selectedDate}
              mode={pickerType}
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              textColor={textColor}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: accent }]}
                onPress={() => setShowNativePicker(false)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── REPEAT MODE SELECTOR ── */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionLabel, { color: subTextColor }]}>REPEAT SCHEDULE</Text>

        <View style={styles.modeTabs}>
          {(['daily', 'custom_days', 'once', 'interval', 'specific_date'] as RepeatMode[]).map((m) => {
            const labels: Record<RepeatMode, string> = {
              daily: 'Daily',
              custom_days: 'Custom Days',
              once: 'Once',
              interval: 'Interval',
              specific_date: 'Date',
            };
            const isSelected = mode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.modeTab,
                  {
                    backgroundColor: isSelected ? accent : innerCardBg,
                    borderColor: isSelected ? accent : borderColor,
                  },
                ]}
                onPress={() => setMode(m)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      color: isSelected ? '#FFFFFF' : textColor,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}>
                  {labels[m]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CUSTOM DAYS SELECTION */}
        {mode === 'custom_days' && (
          <View style={styles.daysContainer}>
            <Text style={[styles.subNote, { color: subTextColor }]}>Select days to repeat:</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((d) => {
                const active = selectedDays.includes(d.id);
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.dayCircle,
                      {
                        backgroundColor: active ? accent : innerCardBg,
                        borderColor: active ? accent : borderColor,
                      },
                    ]}
                    onPress={() => toggleDay(d.id)}
                    activeOpacity={0.7}>
                    <Text style={[styles.dayCircleText, { color: active ? '#FFFFFF' : textColor }]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* INTERVAL OPTIONS */}
        {mode === 'interval' && (
          <View style={styles.intervalContainer}>
            <Text style={[styles.subNote, { color: subTextColor }]}>Repeat every interval:</Text>
            <View style={styles.intervalRow}>
              {INTERVAL_OPTIONS.map((mins) => {
                const active = intervalMinutes === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.intervalChip,
                      {
                        backgroundColor: active ? accent : innerCardBg,
                        borderColor: active ? accent : borderColor,
                      },
                    ]}
                    onPress={() => setIntervalMinutes(mins)}
                    activeOpacity={0.7}>
                    <Text style={[styles.intervalChipText, { color: active ? '#FFFFFF' : textColor }]}>
                      {mins >= 60 ? `${mins / 60} hr` : `${mins} min`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* SPECIFIC DATE */}
        {mode === 'specific_date' && (
          <TouchableOpacity
            style={[styles.dateSelectBtn, { backgroundColor: innerCardBg, borderColor }]}
            onPress={() => {
              setPickerType('date');
              setShowNativePicker(true);
            }}
            activeOpacity={0.75}>
            <Text style={[styles.dateSelectText, { color: textColor }]}>
              📅 {selectedDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={{ color: accent, fontWeight: '700' }}>Change Date ➜</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── LABEL & PRESETS ── */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionLabel, { color: subTextColor }]}>ALARM LABEL</Text>
        <TextInput
          style={[styles.input, { color: textColor, backgroundColor: innerCardBg, borderColor }]}
          value={label}
          onChangeText={setLabel}
          placeholder="Alarm or Reminder label..."
          placeholderTextColor={isDark ? '#7A7A80' : '#9E9EA4'}
          maxLength={40}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
          {PRESET_LABELS.map((p) => {
            const isPicked = label === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: isPicked ? (isDark ? 'rgba(10, 132, 255, 0.25)' : 'rgba(0, 122, 255, 0.15)') : innerCardBg,
                    borderColor: isPicked ? accent : borderColor,
                  },
                ]}
                onPress={() => setLabel(p)}>
                <Text style={[styles.presetText, { color: isPicked ? accent : textColor, fontWeight: isPicked ? '700' : '500' }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── SAVE BUTTON ── */}
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: accent, opacity: loading ? 0.7 : 1 }]}
        onPress={handleSetAlarm}
        disabled={loading}
        activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>{loading ? 'Scheduling...' : '🔔 Set Alarm'}</Text>
      </TouchableOpacity>

      {/* ── SCHEDULED ALARMS LIST ── */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Scheduled Alarms ({alarms.length})
        </Text>
        {alarms.length > 0 && (
          <TouchableOpacity onPress={handleCancelAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.cancelAllBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {alarms.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>Koi alarm active nahi hai</Text>
          <Text style={[styles.emptySub, { color: subTextColor }]}>
            Upar se time aur repeat schedule select karke naya alarm set karein.
          </Text>
        </View>
      ) : (
        alarms.map((item) => (
          <View key={item.identifier} style={[styles.alarmCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.alarmLeft}>
              <Text style={[styles.alarmTitleText, { color: textColor }]}>
                {item.content.title ?? 'Alarm'}
              </Text>
              <Text style={[styles.alarmScheduleText, { color: subTextColor }]}>
                {formatTriggerDetails(item.trigger)}
              </Text>
              {item.content.body ? (
                <Text style={[styles.alarmBodyText, { color: accent }]}>{item.content.body}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => handleCancelOne(item.identifier, item.content.title ?? 'Alarm')}
              style={styles.deleteCircle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.deleteCross}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  testBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  testBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  bigTimeContainer: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigTimeText: {
    fontSize: 50,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  tapBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tapToChange: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  doneBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  modeTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeTab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  modeTabText: {
    fontSize: 13,
  },
  daysContainer: {
    marginTop: 14,
  },
  subNote: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayCircleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  intervalContainer: {
    marginTop: 14,
  },
  intervalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  intervalChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateSelectBtn: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateSelectText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  presetsScroll: {
    marginTop: 12,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  presetText: {
    fontSize: 13,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cancelAllBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  alarmCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alarmLeft: {
    flex: 1,
    paddingRight: 10,
  },
  alarmTitleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  alarmScheduleText: {
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  alarmBodyText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  deleteCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCross: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '800',
  },
});
