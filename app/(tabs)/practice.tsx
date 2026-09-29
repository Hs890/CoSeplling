import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Card } from '@/components/Card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  CATEGORIES,
  DIFFICULTIES,
  DURATIONS,
} from '@/lib/constants';
import { getSetting } from '@/db/queries/settings';
import { getApiKey } from '@/lib/secureKey';
import { buildSessionQueue } from '@/lib/wordPicker';
import { speakWord, stopSpeech } from '@/lib/tts';
import {
  createSession,
  finalizeSession,
  recordAttempt,
} from '@/db/queries/attempts';
import { upsertMistake, getMistakes } from '@/db/queries/mistakes';
import { WordItem } from '@/db/queries/words';

type PracticeState = 'setup' | 'session' | 'results';
type SessionMode = 'normal' | 'mistakes_only';

interface AttemptRecord {
  wordId: number;
  word: string;
  typed: string;
  correct: boolean;
}

export default function PracticeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ mode?: string }>();
  const router = useRouter();

  // Setup state
  const [state, setState] = useState<PracticeState>('setup');
  const [sessionMode, setSessionMode] = useState<SessionMode>('normal');
  const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>(10);
  const [customDuration, setCustomDuration] = useState('10');
  const [selectedCategory, setSelectedCategory] = useState<string>('Everyday English');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Medium');
  const [customCategory, setCustomCategory] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);

  // Session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [queue, setQueue] = useState<WordItem[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; word: string } | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  // Refs to prevent stale closure issues in timers and async callbacks
  const attemptsRef = useRef<AttemptRecord[]>([]);
  const sessionIdRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const isTimeUpRef = useRef<boolean>(false);
  const speechRateRef = useRef<number>(1.0);

  // Sync refs
  attemptsRef.current = attempts;
  sessionIdRef.current = sessionId;
  isTimeUpRef.current = isTimeUp;
  speechRateRef.current = speechRate;

  // Load defaults & check parameters when screen gains focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        try {
          const key = await getApiKey();
          const rate = await getSetting('speechRate');
          const defaultDur = await getSetting('defaultDuration');
          const defaultCat = await getSetting('defaultCategory');
          const defaultDiff = await getSetting('difficulty');
          const currentMistakes = await getMistakes();

          if (isMounted) {
            setHasApiKey(Boolean(key && key.trim().length > 0));
            if (rate) setSpeechRate(parseFloat(rate) || 1.0);
            setMistakeCount(currentMistakes.length);

            // Apply defaults only if in setup mode
            if (state === 'setup') {
              if (params.mode === 'mistakes') {
                setSessionMode('mistakes_only');
                // Consume the param so later visits to this tab start in normal mode
                router.setParams({ mode: undefined } as any);
              } else {
                if (defaultDur) {
                  const parsed = parseInt(defaultDur, 10);
                  if ([5, 10, 15, 20, 30].includes(parsed)) {
                    setSelectedDuration(parsed);
                  } else if (!isNaN(parsed)) {
                    setSelectedDuration('custom');
                    setCustomDuration(defaultDur);
                  }
                }
                if (defaultCat) setSelectedCategory(defaultCat);
                if (defaultDiff) setSelectedDifficulty(defaultDiff);
              }
            }
          }
        } catch (e) {
          console.error('Failed to load practice settings:', e);
        }
      })();

      return () => {
        isMounted = false;
        stopSpeech();
      };
    }, [state, params.mode])
  );

  // Countdown timer
  useEffect(() => {
    if (state !== 'session' || !sessionId) return;

    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      const plannedSec =
        typeof selectedDuration === 'number'
          ? selectedDuration * 60
          : (parseInt(customDuration, 10) || 10) * 60;
      const remaining = Math.max(0, plannedSec - elapsedSec);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsTimeUp(true);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [state, sessionId, selectedDuration, customDuration]);

  const handlePlayAudio = async (wordToSpeak: string) => {
    await speakWord(wordToSpeak, speechRateRef.current);
  };

  const startSession = async () => {
    if (sessionMode === 'mistakes_only' && mistakeCount === 0) {
      Alert.alert('No Mistakes', 'You do not have any recorded mistakes to practice yet!');
      return;
    }

    setLoading(true);
    try {
      const durationSec =
        typeof selectedDuration === 'number'
          ? selectedDuration * 60
          : (parseInt(customDuration, 10) || 10) * 60;

      const effectiveCategory =
        sessionMode === 'mistakes_only'
          ? 'Mistakes'
          : selectedCategory === 'Custom' && customCategory.trim()
          ? customCategory.trim()
          : selectedCategory;

      const effectiveDifficulty =
        sessionMode === 'mistakes_only' ? 'Review' : selectedDifficulty;

      const result = await createSession(
        durationSec,
        effectiveCategory,
        effectiveDifficulty
      );

      const newSessionId = result.lastInsertRowId as number;
      setSessionId(newSessionId);
      sessionIdRef.current = newSessionId;

      const now = Date.now();
      sessionStartTimeRef.current = now;
      setTimeRemaining(durationSec);
      setIsTimeUp(false);
      setAttempts([]);
      attemptsRef.current = [];
      setCurrentWordIndex(0);
      setUserInput('');
      setFeedback(null);

      // Fetch API Key & build word queue
      const apiKey = await getApiKey();
      const model = await getSetting('model');

      const sessionQueue = await buildSessionQueue(
        selectedCategory,
        selectedDifficulty,
        apiKey || undefined,
        model || undefined,
        [],
        sessionMode,
        customCategory
      );

      if (sessionQueue.length === 0) {
        Alert.alert('Notice', 'No words available. Please check your category or connection.');
        setLoading(false);
        return;
      }

      setQueue(sessionQueue);
      setState('session');

      // Auto-play first word
      setTimeout(() => {
        handlePlayAudio(sessionQueue[0].word);
      }, 400);
    } catch (error) {
      console.error('Failed to start practice session:', error);
      Alert.alert('Error', 'Failed to start practice session');
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    const sId = sessionIdRef.current;
    if (!sId) return;

    await stopSpeech();
    setState('results');

    const currentAttempts = attemptsRef.current;
    const correctCount = currentAttempts.filter((a) => a.correct).length;
    await finalizeSession(sId, currentAttempts.length, correctCount);
  };

  const submitAnswer = async () => {
    const sId = sessionIdRef.current;
    if (!sId || queue.length === 0) return;

    const currentWord = queue[currentWordIndex];
    const cleanedInput = userInput.trim().toLowerCase();
    const isCorrect = cleanedInput === currentWord.word.trim().toLowerCase();

    // 1. Record Attempt to DB (same category/difficulty labels as the session row)
    const attemptCategory =
      sessionMode === 'mistakes_only'
        ? 'Mistakes'
        : selectedCategory === 'Custom'
        ? customCategory.trim() || 'Custom'
        : selectedCategory;
    await recordAttempt(
      sId,
      currentWord.id,
      userInput.trim(),
      isCorrect,
      attemptCategory,
      sessionMode === 'mistakes_only' ? 'Review' : selectedDifficulty
    );

    // 2. Track / Update Mistakes (Item 5: count correct on known mistakes too!)
    if (!isCorrect) {
      await upsertMistake(currentWord.id, currentWord.word, userInput.trim(), false);
    } else {
      await upsertMistake(currentWord.id, currentWord.word, userInput.trim(), true);
    }

    // 3. Update local state
    const newAttempt: AttemptRecord = {
      wordId: currentWord.id,
      word: currentWord.word,
      typed: userInput.trim(),
      correct: isCorrect,
    };

    const updatedAttempts = [...attemptsRef.current, newAttempt];
    setAttempts(updatedAttempts);
    attemptsRef.current = updatedAttempts;
    setFeedback({ correct: isCorrect, word: currentWord.word });
  };

  const goToNextWord = async () => {
    // If timer expired and word has been completed, conclude session smoothly!
    if (isTimeUpRef.current) {
      await endSession();
      return;
    }

    setUserInput('');
    setFeedback(null);

    const nextIndex = currentWordIndex + 1;
    if (nextIndex >= queue.length) {
      // Need to fetch next batch
      setLoading(true);
      try {
        const apiKey = await getApiKey();
        const model = await getSetting('model');
        const existingIds = queue.map((w) => w.id);

        const newBatch = await buildSessionQueue(
          selectedCategory,
          selectedDifficulty,
          apiKey || undefined,
          model || undefined,
          existingIds,
          sessionMode,
          customCategory
        );

        if (newBatch.length > 0) {
          const combined = [...queue, ...newBatch];
          setQueue(combined);
          setCurrentWordIndex(nextIndex);
          handlePlayAudio(combined[nextIndex].word);
        } else {
          // If no more words could be built, end session gracefully
          await endSession();
        }
      } catch {
        await endSession();
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentWordIndex(nextIndex);
      handlePlayAudio(queue[nextIndex].word);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // SETUP VIEW
  // -------------------------------------------------------------
  if (state === 'setup') {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {!hasApiKey && (
            <View style={[styles.offlineBanner, { borderColor: colors.warning }]}>
              <ThemedText style={styles.offlineBannerText}>
                ℹ️ Offline Mode active (using local IELTS word bank). Add an OpenRouter key in Settings for AI generation.
              </ThemedText>
            </View>
          )}

          {/* Mode Selector */}
          <Card>
            <ThemedText style={styles.sectionTitle}>Practice Mode</ThemedText>
            <View style={styles.chipRow}>
              <Chip
                label="Standard Practice"
                selected={sessionMode === 'normal'}
                onPress={() => setSessionMode('normal')}
              />
              <Chip
                label={`Review Mistakes (${mistakeCount})`}
                selected={sessionMode === 'mistakes_only'}
                onPress={() => setSessionMode('mistakes_only')}
              />
            </View>
          </Card>

          {/* Duration */}
          <Card>
            <ThemedText style={styles.sectionTitle}>Duration (minutes)</ThemedText>
            <View style={styles.chipRow}>
              {[...DURATIONS].map((d) => (
                <Chip
                  key={d}
                  label={`${d} min`}
                  selected={selectedDuration === d}
                  onPress={() => setSelectedDuration(d)}
                />
              ))}
              <Chip
                label="Custom"
                selected={selectedDuration === 'custom'}
                onPress={() => setSelectedDuration('custom')}
              />
            </View>
            {selectedDuration === 'custom' && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
                    color: colors.text,
                    borderColor: colors.icon,
                  },
                ]}
                placeholder="Enter duration in minutes (e.g. 12)"
                placeholderTextColor={colors.icon}
                value={customDuration}
                onChangeText={setCustomDuration}
                keyboardType="number-pad"
              />
            )}
          </Card>

          {sessionMode === 'normal' && (
            <>
              {/* Category */}
              <Card>
                <ThemedText style={styles.sectionTitle}>Category</ThemedText>
                <View style={styles.chipRow}>
                  {CATEGORIES.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={selectedCategory === c}
                      onPress={() => {
                        setSelectedCategory(c);
                        if (c !== 'Custom') {
                          setCustomCategory('');
                        }
                      }}
                    />
                  ))}
                </View>
                {selectedCategory === 'Custom' && (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
                        color: colors.text,
                        borderColor: colors.icon,
                      },
                    ]}
                    placeholder="e.g., Medical Terms, Space, Law"
                    placeholderTextColor={colors.icon}
                    value={customCategory}
                    onChangeText={setCustomCategory}
                  />
                )}
              </Card>

              {/* Difficulty */}
              <Card>
                <ThemedText style={styles.sectionTitle}>Difficulty</ThemedText>
                <View style={styles.chipRow}>
                  {DIFFICULTIES.map((d) => (
                    <Chip
                      key={d}
                      label={d}
                      selected={selectedDifficulty === d}
                      onPress={() => setSelectedDifficulty(d)}
                    />
                  ))}
                </View>
              </Card>
            </>
          )}

          <PrimaryButton
            label={loading ? 'Preparing session...' : 'Start Practice'}
            onPress={startSession}
            disabled={loading}
          />
        </ScrollView>
      </ThemedView>
    );
  }

  // -------------------------------------------------------------
  // SESSION VIEW
  // -------------------------------------------------------------
  if (state === 'session' && queue.length > 0) {
    const currentWord = queue[currentWordIndex];

    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.timerBadge}>
            <ThemedText style={[styles.timer, isTimeUp ? { color: colors.danger } : null]}>
              ⏱️ {formatTime(timeRemaining)}
            </ThemedText>
          </View>
          <ThemedText style={styles.progress}>
            Word {currentWordIndex + 1} of {queue.length}
          </ThemedText>
        </View>

        {isTimeUp && (
          <View style={[styles.timeUpNotice, { backgroundColor: colors.warning }]}>
            <ThemedText style={styles.timeUpNoticeText}>
              ⏳ Time is up! Submit this word to complete your session.
            </ThemedText>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Card>
            {!feedback ? (
              <View style={styles.audioPromptBox}>
                <ThemedText style={styles.wordPrompt}>Listen carefully and spell the word:</ThemedText>
                <Pressable
                  onPress={() => handlePlayAudio(currentWord.word)}
                  style={[styles.audioPlayButton, { backgroundColor: colors.tint }]}
                >
                  <ThemedText style={styles.audioPlayText}>🔊 Play Audio</ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.feedbackContainer}>
                <View
                  style={[
                    styles.feedbackBanner,
                    {
                      backgroundColor: feedback.correct ? colors.success : colors.danger,
                    },
                  ]}
                >
                  <ThemedText style={styles.feedbackText}>
                    {feedback.correct ? '✓ Correct!' : '✗ Incorrect'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.correctSpelling}>
                  Correct spelling: <ThemedText style={styles.correctSpellingBold}>{feedback.word}</ThemedText>
                </ThemedText>
              </View>
            )}
          </Card>

          <Card>
            <TextInput
              style={[
                styles.spellingInput,
                {
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F5F5F7',
                  color: colors.text,
                  borderColor: colors.icon,
                },
              ]}
              placeholder="Type the spelling here..."
              placeholderTextColor={colors.icon}
              value={userInput}
              onChangeText={setUserInput}
              editable={!feedback}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoFocus
              onSubmitEditing={() => {
                if (!feedback && userInput.trim()) {
                  submitAnswer();
                }
              }}
            />

            {!feedback ? (
              <PrimaryButton
                label="Submit Answer"
                onPress={submitAnswer}
                disabled={!userInput.trim()}
              />
            ) : (
              <PrimaryButton
                label={isTimeUp ? 'Finish Session' : 'Next Word →'}
                onPress={goToNextWord}
              />
            )}
          </Card>

          <Pressable onPress={endSession} style={styles.earlyEndButton}>
            <ThemedText style={[styles.earlyEndText, { color: colors.danger }]}>
              End Practice Session
            </ThemedText>
          </Pressable>
        </ScrollView>
      </ThemedView>
    );
  }

  // -------------------------------------------------------------
  // RESULTS VIEW
  // -------------------------------------------------------------
  if (state === 'results') {
    const correctCount = attempts.filter((a) => a.correct).length;
    const totalCount = attempts.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const reviewList = attempts.filter((a) => !a.correct);

    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.resultCard}>
            <ThemedText style={styles.congratsTitle}>Session Complete! 🎉</ThemedText>
            <View style={styles.resultGrid}>
              <View style={styles.resultStatBox}>
                <ThemedText style={styles.resultStatValue}>{totalCount}</ThemedText>
                <ThemedText style={styles.resultStatLabel}>Total Words</ThemedText>
              </View>
              <View style={styles.resultStatBox}>
                <ThemedText style={[styles.resultStatValue, { color: colors.success }]}>
                  {correctCount}
                </ThemedText>
                <ThemedText style={styles.resultStatLabel}>Correct</ThemedText>
              </View>
              <View style={styles.resultStatBox}>
                <ThemedText style={[styles.resultStatValue, { color: colors.danger }]}>
                  {totalCount - correctCount}
                </ThemedText>
                <ThemedText style={styles.resultStatLabel}>Wrong</ThemedText>
              </View>
              <View style={styles.resultStatBox}>
                <ThemedText style={[styles.resultStatValue, { color: colors.tint }]}>
                  {accuracy}%
                </ThemedText>
                <ThemedText style={styles.resultStatLabel}>Accuracy</ThemedText>
              </View>
            </View>
          </Card>

          {reviewList.length > 0 && (
            <Card>
              <ThemedText style={styles.sectionTitle}>Words to Review ({reviewList.length})</ThemedText>
              {reviewList.map((attempt, idx) => (
                <View key={idx} style={styles.attemptLine}>
                  <View style={styles.attemptLeft}>
                    <ThemedText style={styles.reviewWord}>{attempt.word}</ThemedText>
                    <ThemedText style={styles.reviewTyped}>
                      You typed: <ThemedText style={{ color: colors.danger }}>{`"${attempt.typed || '(blank)'}"`}</ThemedText>
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handlePlayAudio(attempt.word)}
                    style={styles.reviewAudioBtn}
                  >
                    <ThemedText>🔊</ThemedText>
                  </Pressable>
                </View>
              ))}
            </Card>
          )}

          <PrimaryButton
            label="Practice Again"
            onPress={() => {
              setState('setup');
            }}
          />
        </ScrollView>
      </ThemedView>
    );
  }

  // Loading state
  return (
    <ThemedView style={styles.container}>
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText style={{ marginTop: 12 }}>Preparing practice session...</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 32,
  },
  offlineBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
  },
  offlineBannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timer: {
    fontSize: 20,
    fontWeight: '700',
  },
  progress: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  timeUpNotice: {
    marginHorizontal: 14,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  timeUpNoticeText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 6,
  },
  audioPromptBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  wordPrompt: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '500',
  },
  audioPlayButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  feedbackContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  feedbackBanner: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  correctSpelling: {
    fontSize: 15,
    marginTop: 4,
  },
  correctSpellingBold: {
    fontWeight: '700',
    fontSize: 16,
  },
  spellingInput: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 14,
  },
  earlyEndButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  earlyEndText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  congratsTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  resultGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  resultStatBox: {
    alignItems: 'center',
  },
  resultStatValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  resultStatLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  attemptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.3)',
  },
  attemptLeft: {
    flex: 1,
  },
  reviewWord: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewTyped: {
    fontSize: 13,
    opacity: 0.8,
  },
  reviewAudioBtn: {
    padding: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
