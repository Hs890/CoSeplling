import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ErrorModal } from '@/components/ErrorModal';
import { Icon, IconName } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SoundBars } from '@/components/SoundBars';
import { Txt } from '@/components/Txt';
import { Colors, Shadows } from '@/constants/theme';
import { MONO } from '@/constants/typography';
import { createSession, listSessions, type SessionListItem } from '@/db/queries/sessions';
import { getSetting } from '@/db/queries/settings';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  DEFAULT_ACCENT,
  DEFAULT_CATEGORY,
  DEFAULT_DIFFICULTY,
  DEFAULT_DURATION_MIN,
  DEFAULT_INTERVAL_SEC,
  DEFAULT_SPEECH_RATE,
} from '@/lib/constants';
import { formatClock } from '@/lib/format';
import { getApiKey } from '@/lib/secureKey';
import { runSession, type CancelToken } from '@/lib/sessionRunner';
import { stopSpeech } from '@/lib/tts';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme()];
  const insets = useSafeAreaInsets();

  // Settings & History State
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [difficulty, setDifficulty] = useState<string>(DEFAULT_DIFFICULTY);
  const [durationMin, setDurationMin] = useState<number>(DEFAULT_DURATION_MIN);
  const [intervalSec, setIntervalSec] = useState<number>(DEFAULT_INTERVAL_SEC);
  const [accent, setAccent] = useState<string>(DEFAULT_ACCENT);
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined);
  const [speechRate, setSpeechRate] = useState<number>(DEFAULT_SPEECH_RATE);
  const [customCategory, setCustomCategory] = useState('');

  // API key state
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null); // null = loading
  const [showApiKeyError, setShowApiKeyError] = useState(false);

  // Active Practice State
  const [isPracticing, setIsPracticing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [timeRemainingSec, setTimeRemainingSec] = useState(0);
  const [nextWordInSec, setNextWordInSec] = useState(0);
  const [spokenCount, setSpokenCount] = useState(0);
  const [replaysLeft, setReplaysLeft] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [sessionStartError, setSessionStartError] = useState<string | null>(null);

  const tokenRef = useRef<CancelToken>({ cancelRequested: false, paused: false, replayRequested: false });
  const noticeRef = useRef<string>('');
  const isPracticingRef = useRef(false);
  isPracticingRef.current = isPracticing;

  const loadData = useCallback(async () => {
    try {
      const [sessionList, cat, diff, dur, interval, acc, voice, rate, customCat, apiKey] = await Promise.all([
        listSessions(),
        getSetting('defaultCategory'),
        getSetting('difficulty'),
        getSetting('defaultDuration'),
        getSetting('defaultInterval'),
        getSetting('accent'),
        getSetting('voiceId'),
        getSetting('speechRate'),
        getSetting('customCategory'),
        getApiKey(),
      ]);

      setSessions(sessionList);
      setHasApiKey(Boolean(apiKey?.trim()));
      if (cat) setCategory(cat);
      if (diff) setDifficulty(diff);
      if (dur) setDurationMin(parseInt(dur, 10) || DEFAULT_DURATION_MIN);
      if (interval) setIntervalSec(parseInt(interval, 10) || DEFAULT_INTERVAL_SEC);
      if (acc) setAccent(acc);
      if (voice) setVoiceId(voice || undefined);
      if (rate) setSpeechRate(parseFloat(rate) || DEFAULT_SPEECH_RATE);
      setCustomCategory(customCat ?? '');
    } catch (e) {
      console.warn('Dashboard failed to load data:', e);
      setHasApiKey(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isPracticingRef.current) {
        loadData();
      }
    }, [loadData])
  );

  // Clean up if component unmounts during active drill
  useEffect(() => {
    return () => {
      tokenRef.current.cancelRequested = true;
      stopSpeech().catch(() => { });
      deactivateKeepAwake('dashboard_session');
    };
  }, []);

  // Hardware back intercepts during active practice
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isPracticingRef.current) {
        handleEndSessionEarly();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  const handleStartSession = async () => {
    // Guard: require API key before starting
    const key = await getApiKey();
    if (!key?.trim()) {
      setHasApiKey(false);
      setShowApiKeyError(true);
      return;
    }

    tokenRef.current = { cancelRequested: false, paused: false, replayRequested: false };
    setIsPreparing(true);
    setIsPaused(false);
    setNotice(null);
    setSpokenCount(0);
    setReplaysLeft(1);

    const totalDurationSec = durationMin * 60;
    setTimeRemainingSec(totalDurationSec);
    setNextWordInSec(intervalSec);

    try {
      const [apiKey, model] = await Promise.all([getApiKey(), getSetting('model')]);
      const activeCategoryLabel = category === 'Custom' ? customCategory.trim() || 'Custom' : category;

      const sid = await createSession(
        totalDurationSec,
        intervalSec,
        activeCategoryLabel,
        difficulty
      );

      setIsPreparing(false);
      setIsPracticing(true);
      await activateKeepAwakeAsync('dashboard_session').catch(() => { });

      await runSession(
        {
          sessionId: sid,
          durationSec: totalDurationSec,
          intervalSec,
          category,
          difficulty,
          customCategoryText: customCategory,
          accent,
          voiceId: voiceId || undefined,
          speechRate,
          apiKey: apiKey || undefined,
          model: model || undefined,
        },
        tokenRef.current,
        {
          onTick: (rem, nxt) => {
            setTimeRemainingSec(rem);
            setNextWordInSec(nxt);
          },
          onWordSpoken: (pos) => {
            setSpokenCount(pos);
          },
          onReplaysLeft: (left) => {
            setReplaysLeft(left);
          },
          onNotice: (msg) => {
            noticeRef.current = msg;
            setNotice(msg);
          },
          onFinished: (result) => {
            setIsPracticing(false);
            deactivateKeepAwake('dashboard_session');
            loadData();
            router.push({
              pathname: '/session/done',
              params: {
                sessionId: String(sid),
                totalWords: String(result.totalWords),
                durationActualSec: String(result.durationActualSec),
                error: result.error ?? '',
                notice: noticeRef.current,
              },
            });
          },
        }
      );
    } catch (e) {
      console.error('Session start failed:', e);
      setIsPreparing(false);
      setIsPracticing(false);
      deactivateKeepAwake('dashboard_session');
      setSessionStartError('Could not start the practice session. Please check your API key and connection.');
    }
  };

  const handleTogglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    tokenRef.current.paused = next;
  };

  const handleRequestReplay = () => {
    if (replaysLeft > 0 && !isPaused) {
      tokenRef.current.replayRequested = true;
    }
  };

  const handleEndSessionEarly = () => {
    setShowEndSessionConfirm(true);
  };

  const handleConfirmEndSession = () => {
    setShowEndSessionConfirm(false);
    tokenRef.current.cancelRequested = true;
  };

  const totalWords = sessions.reduce((s, x) => s + x.wordCount, 0);
  const totalChecked = sessions.reduce((s, x) => s + x.correctCount + x.retestCount, 0);
  const pctChecked = totalWords > 0 ? Math.round((totalChecked / totalWords) * 100) : 0;
  const estimatedWords = Math.max(1, Math.floor((durationMin * 60) / intervalSec));

  const progress = Math.max(0, Math.min(1, 1 - nextWordInSec / (intervalSec || 1)));
  const dictating = !isPaused && nextWordInSec > intervalSec - 3;
  const noReplays = replaysLeft === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title={isPracticing ? 'Active Dictation' : 'Dashboard'} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP STATS GRID */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={styles.statTop}>
              <Icon name="history-edu" size={18} color="primary" />
              <Txt variant="labelSm" color="textSecondary">
                SESSIONS
              </Txt>
            </View>
            <Txt variant="displayLg" color="primary" style={styles.statNumber}>
              {sessions.length}
            </Txt>
            <Txt variant="labelSm" color="textSecondary">
              Completed drills
            </Txt>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={styles.statTop}>
              <Icon name="stars" size={18} color="secondary" />
              <Txt variant="labelSm" color="textSecondary">
                TOTAL WORDS
              </Txt>
            </View>
            <Txt variant="displayLg" color="secondary" style={styles.statNumber}>
              {totalWords}
            </Txt>
            <Txt variant="labelSm" color="textSecondary">
              {pctChecked}% reviewed
            </Txt>
          </View>
        </View>

        {/* HERO DRILL CONTROLLER */}
        <Card tone="container" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTextWrap}>
              <Txt variant="labelSm" color="textSecondary" style={styles.eyebrow}>
                PRACTICE CATEGORY
              </Txt>
              <Txt variant="headlineMd" color="text" numberOfLines={1} style={styles.categoryTitle}>
                {category}
              </Txt>
            </View>

            {/* Setting Icon Button */}
            {!isPracticing && (
              <Pressable
                onPress={() => router.push('/settings/practice-defaults' as any)}
                accessibilityRole="button"
                accessibilityLabel="Configure practice settings"
                style={({ pressed }) => [
                  styles.settingBtn,
                  {
                    backgroundColor: colors.containerLow,
                    borderColor: colors.outlineVariant,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
              >
                <Icon name="tune" size={18} color="primary" />
              </Pressable>
            )}
          </View>

          {/* No API key error modal */}
          <ErrorModal
            visible={showApiKeyError}
            title="API Key Required"
            message="A Google Gemini API key is needed to start a session. Go to Settings → AI Engine to add your key."
            settingsHref="/settings/ai-engine"
            onClose={() => setShowApiKeyError(false)}
          />

          {/* Start Drill Button when idle */}
          {!isPracticing && (
            <PrimaryButton
              label={isPreparing ? 'Preparing Audio…' : 'Start Practice Drill'}
              icon="play-arrow"
              size="lg"
              disabled={isPreparing}
              onPress={handleStartSession}
              style={styles.startBtn}
            />
          )}
        </Card>

        {/* ACTIVE DICTATION SECTION (Appears below on Dashboard when started) */}
        {isPracticing && (
          <View style={styles.activeSection}>
            {/* Meta indicator bar */}
            <View style={[styles.metaBar, { backgroundColor: colors.containerLow }, Shadows.sm]}>
              <View style={styles.metaLeft}>
                <Txt variant="labelSm" color="textSecondary" numberOfLines={1} style={styles.flex}>
                  {category} · {difficulty} · {intervalSec}s Interval
                </Txt>
              </View>
              <View style={styles.metaRight}>
                <View style={[styles.dot, { backgroundColor: isPaused ? colors.outline : colors.secondary }]} />
                <Txt variant="labelSm" color={isPaused ? 'textSecondary' : 'secondary'} style={styles.semibold}>
                  {isPaused ? 'Paused' : 'Active'}
                </Txt>
              </View>
            </View>

            {/* Metric pills */}
            <View style={styles.pills}>
              <MetricPill icon="schedule" label="Session" value={`${formatClock(durationMin * 60)} total`} />
              <MetricPill icon="speed" label="Pacing" value={`${intervalSec}s pace`} />
              <MetricPill icon="format-list-numbered" label="Progress" value={`${spokenCount} / ${estimatedWords}`} accent />
            </View>

            {/* Focal Player Card */}
            <Card radius={24} padding={24} elevation="md" style={styles.focal}>
              <Txt
                variant="displayLg"
                style={[styles.timer, { fontFamily: MONO, opacity: isPaused ? 0.6 : 1 }]}
              >
                {formatClock(timeRemainingSec)}
              </Txt>
              <Txt variant="labelSm" color="textSecondary" style={styles.upper}>
                Session Remaining
              </Txt>

              <View style={[styles.statusBadge, { backgroundColor: colors.secondaryContainer }]}>
                <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                <Txt variant="labelMd" color="onSecondaryContainer" style={styles.semibold}>
                  {isPaused ? 'Paused' : dictating ? 'Audio Dictating...' : 'Write it down'}
                </Txt>
              </View>

              {/* Replay Button */}
              <Pressable
                onPress={handleRequestReplay}
                disabled={noReplays || isPaused}
                accessibilityRole="button"
                accessibilityLabel="Replay current word"
                style={({ pressed }) => [styles.replayWrap, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
              >
                <View style={[styles.glow, { backgroundColor: colors.primaryFixedDim }]} />
                <View
                  style={[
                    styles.replay,
                    { backgroundColor: colors.primaryContainer, opacity: noReplays || isPaused ? 0.6 : 1 },
                    Shadows.md,
                  ]}
                >
                  <Icon name="volume-up" size={36} color="onPrimary" />
                  <Txt variant="labelSm" color={colors.primaryFixed} style={styles.replayLabel}>
                    Replay
                  </Txt>
                </View>
              </Pressable>

              <View style={styles.repeatRow}>
                <Icon name="replay" size={16} color={noReplays ? 'error' : 'primary'} />
                <Txt variant="labelMd" color={noReplays ? 'error' : 'textSecondary'}>
                  {noReplays ? 'No repeats remaining for this word' : 'Tap to repeat audio (1 repeat left)'}
                </Txt>
              </View>

              {/* Next word interval progress */}
              <View style={[styles.intervalBox, { backgroundColor: colors.containerLow }]}>
                <View style={styles.intervalHead}>
                  <View style={styles.intervalLabel}>
                    <Icon name="hourglass-top" size={18} color="secondary" />
                    <Txt variant="labelMd" style={styles.semibold}>
                      Next Word Interval
                    </Txt>
                  </View>
                  <Txt variant="labelMd" color="primary" style={styles.bold}>
                    {Math.ceil(nextWordInSec)}s
                  </Txt>
                </View>
                <View style={[styles.track, { backgroundColor: colors.containerHighest }]}>
                  <View
                    style={[styles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.primary }]}
                  />
                </View>
              </View>
            </Card>

            {notice && (
              <Card tone="container" radius={16} padding={14} elevation="none">
                <Txt variant="labelMd" color="textSecondary">
                  {notice}
                </Txt>
              </Card>
            )}

            {/* Acoustic channel */}
            <Card radius={16} padding={12} style={styles.channel}>
              <Txt variant="labelSm" color="textSecondary">
                Acoustic Audio Channel
              </Txt>
              <SoundBars active={!isPaused} />
            </Card>

            {/* Active Control Actions */}
            <View style={styles.actions}>
              <PrimaryButton
                label={isPaused ? 'Resume Practice' : 'Pause Practice'}
                icon={isPaused ? 'play-arrow' : 'pause'}
                variant={isPaused ? 'success' : 'primary'}
                onPress={handleTogglePause}
                style={styles.pauseButton}
              />
              <PrimaryButton
                label="End & Review Word List"
                icon="stop-circle"
                variant="danger"
                size="sm"
                onPress={handleEndSessionEarly}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* End Session Early Confirmation Modal */}
      <ConfirmModal
        visible={showEndSessionConfirm}
        title="End Practice Drill?"
        message="Finish now and review the word list. Words spoken so far are saved in your history."
        iconName="stop-circle"
        confirmLabel="End & Review"
        onConfirm={handleConfirmEndSession}
        onCancel={() => setShowEndSessionConfirm(false)}
      />

      {/* Session Start Error Modal */}
      {sessionStartError && (
        <ErrorModal
          visible={true}
          title="Could Not Start"
          message={sessionStartError}
          iconName="error-outline"
          settingsHref="/settings/ai-engine"
          actionLabel="Check AI Settings"
          onClose={() => setSessionStartError(null)}
        />
      )}
    </View>
  );
}

function MetricPill(props: { icon: IconName; label: string; value: string; accent?: boolean }) {
  const colors = Colors[useColorScheme()];
  return (
    <View style={[styles.metric, { backgroundColor: colors.card }, Shadows.sm]}>
      <View style={styles.metricHead}>
        <Icon name={props.icon} size={15} color="textSecondary" />
        <Txt variant="labelSm" color="textSecondary">
          {props.label}
        </Txt>
      </View>
      <Txt variant="labelLg" color={props.accent ? 'primary' : 'text'} style={props.accent && styles.bold}>
        {props.value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingBottom: 40, gap: 16 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 18 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statNumber: { lineHeight: 36, marginBottom: 2 },
  heroCard: { padding: 16, borderRadius: 18, gap: 14 },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTextWrap: { flex: 1 },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryTitle: {
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
  },
  settingBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: { marginTop: 4 },
  activeSection: { gap: 14 },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pills: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center', gap: 2 },
  metricHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  focal: { alignItems: 'center' },
  timer: { fontSize: 44, lineHeight: 52, letterSpacing: 0 },
  upper: { textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginTop: 12,
    marginBottom: 20,
  },
  replayWrap: { width: 144, height: 144, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 144, height: 144, borderRadius: 72, opacity: 0.3 },
  replay: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
  replayLabel: { marginTop: 4 },
  repeatRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  intervalBox: { alignSelf: 'stretch', padding: 14, borderRadius: 16, marginTop: 20 },
  intervalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  intervalLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  track: { height: 8, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9999 },
  channel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  actions: { gap: 10, paddingTop: 4 },
  pauseButton: { height: 52 },
  flex: { flex: 1 },
  semibold: { fontFamily: 'Inter_600SemiBold' },
  bold: { fontFamily: 'Inter_700Bold' },
});
