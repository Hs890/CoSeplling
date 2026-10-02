import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { spellingHint } from '@/lib/spellingHints';
import { speakWord } from '@/lib/tts';
import { getSetting } from '@/db/queries/settings';
import {
  getAllSpokenWords,
  getWordsMarkedAsAgain,
  updateWordMarkById,
  type AllSpokenWordItem,
} from '@/db/queries/sessions';
import { DEFAULT_ACCENT, DEFAULT_SPEECH_RATE } from '@/lib/constants';

export default function WordListsScreen() {
  const colors = Colors[useColorScheme()];

  const [words, setWords] = useState<AllSpokenWordItem[]>([]);
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);

  const loadWords = useCallback(async () => {
    try {
      const list = await getAllSpokenWords();
      setWords(list);
    } catch (e) {
      console.warn('Failed to load words:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [loadWords])
  );

  const playWord = async (word: string) => {
    try {
      const [rate, accent, voice] = await Promise.all([
        getSetting('speechRate'),
        getSetting('accent'),
        getSetting('voiceId'),
      ]);
      await speakWord(
        word,
        parseFloat(rate ?? '') || DEFAULT_SPEECH_RATE,
        accent || DEFAULT_ACCENT,
        voice || undefined
      );
    } catch (e) {
      console.warn('Playback error:', e);
    }
  };

  const handleMarkCorrect = async (item: AllSpokenWordItem) => {
    const nextMark = item.mark === 'correct' ? null : 'correct';
    setWords((prev) => prev.map((w) => (w.id === item.id ? { ...w, mark: nextMark } : w)));
    try {
      await updateWordMarkById(item.id, nextMark);
    } catch {
      loadWords();
    }
  };

  const handleMarkAgain = async (item: AllSpokenWordItem) => {
    setWords((prev) => prev.filter((w) => w.id !== item.id));
    try {
      await updateWordMarkById(item.id, 'retest');
    } catch {
      loadWords();
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Word Lists" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Continuous Clean Word List */}
        <View style={styles.list}>
          {words.map((item) => {
            const isExpanded = expandedWordId === item.id;
            const hint = spellingHint(item.word);
            const isCorrect = item.mark === 'correct';

            return (
              <View
                key={item.id}
                style={[
                  styles.wordCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isCorrect ? colors.primary : colors.outlineVariant,
                  },
                  Shadows.sm,
                ]}
              >
                {/* Main Word Row */}
                <View style={styles.wordRow}>
                  <View style={styles.wordLeft}>
                    <Pressable
                      onPress={() => playWord(item.word)}
                      accessibilityRole="button"
                      accessibilityLabel={`Pronounce ${item.word}`}
                      style={[styles.speakerBtn, { backgroundColor: colors.containerLow }]}
                      hitSlop={6}
                    >
                      <Icon name="volume-up" size={18} color="primary" />
                    </Pressable>

                    <Pressable
                      onPress={() => setExpandedWordId(isExpanded ? null : item.id)}
                      style={styles.wordTextWrap}
                      hitSlop={6}
                    >
                      <Txt variant="headlineMd" style={styles.wordTitle} numberOfLines={1}>
                        {item.word}
                      </Txt>
                    </Pressable>
                  </View>

                  {/* Right side: If marked correct, show only Correct badge and remove action buttons */}
                  {isCorrect ? (
                    <Pressable
                      onPress={() => handleMarkCorrect(item)}
                      style={({ pressed }) => [
                        styles.correctBadge,
                        {
                          backgroundColor: colors.primary,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                      hitSlop={6}
                    >
                      <Icon name="check-circle" size={15} color="#FFFFFF" />
                      <Txt variant="labelSm" style={styles.correctBadgeText}>
                        Correct
                      </Txt>
                    </Pressable>
                  ) : (
                    /* Mark Action Buttons (When not yet correct) */
                    <View style={styles.actionsGroup}>
                      {/* Correct Button */}
                      <Pressable
                        onPress={() => handleMarkCorrect(item)}
                        accessibilityRole="button"
                        accessibilityLabel="Mark as correct"
                        style={({ pressed }) => [
                          styles.markBtn,
                          {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Icon name="check" size={15} color="#FFFFFF" />
                        <Txt variant="labelSm" style={styles.btnTextWhite}>
                          Correct
                        </Txt>
                      </Pressable>

                      {/* Again Button */}
                      <Pressable
                        onPress={() => handleMarkAgain(item)}
                        accessibilityRole="button"
                        accessibilityLabel="Mark as again for retry"
                        style={({ pressed }) => [
                          styles.markBtn,
                          {
                            backgroundColor: colors.primaryContainer,
                            borderColor: colors.primary,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Icon name="replay" size={15} color="#FFFFFF" />
                        <Txt variant="labelSm" style={styles.btnTextWhite}>
                          Again
                        </Txt>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Optional Expanded Spelling Hint */}
                {isExpanded && hint && (
                  <View style={[styles.hintBox, { backgroundColor: colors.containerLow }]}>
                    <Icon name={hint.icon} size={15} color="primary" />
                    <Txt variant="bodyMd" color="textSecondary" style={styles.flex}>
                      {hint.parts.map((part, i) => (
                        <Txt
                          key={i}
                          variant="bodyMd"
                          color={part.highlight ? 'primary' : 'textSecondary'}
                          style={part.highlight && styles.semibold}
                        >
                          {part.text}
                        </Txt>
                      ))}
                    </Txt>
                  </View>
                )}
              </View>
            );
          })}

          {words.length === 0 && (
            <Card tone="low" style={styles.empty}>
              <Icon name="format-list-numbered" size={32} color="outline" />
              <Txt variant="labelLg" style={styles.emptyTitle}>
                No words in review list
              </Txt>
              <Txt variant="bodyMd" color="textSecondary" style={styles.emptySub}>
                Start a practice drill on Dashboard to dictate new words.
              </Txt>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110, gap: 12 },
  list: { gap: 8, marginTop: 4 },
  wordCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  wordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  speakerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  wordTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnTextWhite: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  correctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  correctBadgeText: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    padding: 28,
    gap: 6,
    borderRadius: 16,
  },
  emptyTitle: { marginTop: 6 },
  emptySub: { textAlign: 'center', lineHeight: 18 },
  flex: { flex: 1 },
  semibold: { fontFamily: 'Inter_600SemiBold' },
});
