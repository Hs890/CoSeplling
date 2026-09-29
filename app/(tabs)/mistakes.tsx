import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMistakes, deleteMistake, getMistakeHistory, MistakeSortOption } from '@/db/queries/mistakes';
import { speakWord } from '@/lib/tts';
import { getSetting } from '@/db/queries/settings';

interface MistakeItem {
  wordId: number;
  word: string;
  lastWrongSpelling: string;
  wrongCount: number;
  correctCount: number;
  lastPracticedAt: number;
}

interface AttemptHistoryItem {
  id: number;
  sessionId: number;
  wordId: number;
  typed: string;
  isCorrect: boolean;
  category: string;
  difficulty: string;
  createdAt: number;
}

const SORT_OPTIONS: { id: MistakeSortOption; label: string }[] = [
  { id: 'wrong', label: 'Most Mistakes' },
  { id: 'recent', label: 'Recent' },
  { id: 'accuracy', label: 'Least Accurate' },
  { id: 'alphabetical', label: 'A – Z' },
];

export default function MistakesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<MistakeSortOption>('wrong');

  // History modal state
  const [selectedMistake, setSelectedMistake] = useState<MistakeItem | null>(null);
  const [historyList, setHistoryList] = useState<AttemptHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadMistakes = useCallback(async () => {
    try {
      const data = await getMistakes(search || undefined, sortBy);
      setMistakes(data);
    } catch (error) {
      console.error('Failed to load mistakes:', error);
    }
  }, [search, sortBy]);

  useFocusEffect(
    useCallback(() => {
      loadMistakes();
    }, [loadMistakes])
  );

  useEffect(() => {
    loadMistakes();
  }, [search, sortBy, loadMistakes]);

  const handlePlaySound = async (word: string) => {
    const rate = await getSetting('speechRate');
    await speakWord(word, parseFloat(rate || '1.0'));
  };

  const handleOpenHistory = async (item: MistakeItem) => {
    setSelectedMistake(item);
    setLoadingHistory(true);
    try {
      const history = await getMistakeHistory(item.wordId);
      setHistoryList(history as AttemptHistoryItem[]);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = (wordId: number, word: string) => {
    Alert.alert('Remove Mistake', `Remove "${word}" from your mistakes list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMistake(wordId);
            if (selectedMistake?.wordId === wordId) {
              setSelectedMistake(null);
            }
            loadMistakes();
          } catch (error) {
            console.error('Delete failed:', error);
          }
        },
      },
    ]);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <ThemedView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
              color: colors.text,
              borderColor: colors.icon,
            },
          ]}
          placeholder="Search mistake words..."
          placeholderTextColor={colors.icon}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Sort Chips */}
      <View style={styles.sortRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
          {SORT_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              label={opt.label}
              selected={sortBy === opt.id}
              onPress={() => setSortBy(opt.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Practice Button if mistakes exist */}
      {mistakes.length > 0 && (
        <View style={styles.actionHeader}>
          <PrimaryButton
            label={`Practice These Mistakes (${mistakes.length})`}
            onPress={() => router.push({ pathname: '/practice', params: { mode: 'mistakes' } } as any)}
            style={{ marginVertical: 4, marginHorizontal: 12 }}
          />
        </View>
      )}

      {/* List / Empty State */}
      {mistakes.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyTitle}>No mistakes found! 🎉</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            {search ? 'Try clearing your search query.' : 'Keep practicing to master your IELTS vocabulary.'}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={mistakes}
          keyExtractor={(item) => item.wordId.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleOpenHistory(item)}>
              <Card style={styles.mistakeCard}>
                <View style={styles.mistakeHeader}>
                  <View style={styles.wordInfo}>
                    <View style={styles.wordTitleRow}>
                      <ThemedText style={styles.word}>{item.word}</ThemedText>
                      <Pressable onPress={() => handlePlaySound(item.word)} style={styles.soundBtn}>
                        <ThemedText>🔊</ThemedText>
                      </Pressable>
                    </View>
                    <ThemedText style={styles.wrongSpelling}>
                      Last wrong: <ThemedText style={{ color: colors.danger }}>{`"${item.lastWrongSpelling}"`}</ThemedText>
                    </ThemedText>
                  </View>

                  <Pressable
                    onPress={() => handleDelete(item.wordId, item.word)}
                    style={styles.deleteButton}
                    hitSlop={10}
                  >
                    <ThemedText style={[styles.deleteText, { color: colors.danger }]}>✕</ThemedText>
                  </Pressable>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.badgeRow}>
                    <ThemedText style={[styles.badgeText, { color: colors.danger }]}>
                      ❌ {item.wrongCount} wrong
                    </ThemedText>
                    <ThemedText style={[styles.badgeText, { color: colors.success, marginLeft: 12 }]}>
                      ✓ {item.correctCount} correct
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.tapPrompt}>Tap for history ›</ThemedText>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}

      {/* History Modal */}
      <Modal
        visible={Boolean(selectedMistake)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedMistake(null)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={[
              styles.modalContent,
              { backgroundColor: colorScheme === 'dark' ? '#1E1E20' : '#FFFFFF' },
            ]}
          >
            {selectedMistake && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <ThemedText style={styles.modalTitle}>{selectedMistake.word}</ThemedText>
                    <ThemedText style={styles.modalSubtitle}>Attempt History</ThemedText>
                  </View>
                  <Pressable onPress={() => setSelectedMistake(null)} style={styles.modalCloseBtn}>
                    <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>✕</ThemedText>
                  </Pressable>
                </View>

                {loadingHistory ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="small" color={colors.tint} />
                  </View>
                ) : historyList.length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <ThemedText style={{ opacity: 0.7 }}>No recorded past attempts.</ThemedText>
                  </View>
                ) : (
                  <ScrollView style={styles.modalScroll}>
                    {historyList.map((att) => (
                      <View key={att.id} style={styles.historyItem}>
                        <View style={styles.historyTop}>
                          <ThemedText
                            style={[
                              styles.historyResult,
                              { color: att.isCorrect ? colors.success : colors.danger },
                            ]}
                          >
                            {att.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </ThemedText>
                          <ThemedText style={styles.historyDate}>{formatDate(att.createdAt)}</ThemedText>
                        </View>
                        <ThemedText style={styles.historyTyped}>
                          You typed: <ThemedText style={{ fontWeight: '600' }}>{`"${att.typed || '(blank)'}"`}</ThemedText>
                        </ThemedText>
                        <ThemedText style={styles.historyMeta}>
                          {att.category} • {att.difficulty}
                        </ThemedText>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <PrimaryButton
                  label="Close"
                  onPress={() => setSelectedMistake(null)}
                  style={{ marginTop: 12, marginHorizontal: 0 }}
                />
              </>
            )}
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  sortRow: {
    paddingVertical: 4,
  },
  sortScroll: {
    paddingHorizontal: 10,
  },
  actionHeader: {
    marginBottom: 4,
  },
  listContent: {
    padding: 12,
    paddingBottom: 32,
  },
  mistakeCard: {
    marginBottom: 10,
    paddingVertical: 12,
  },
  mistakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordInfo: {
    flex: 1,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  word: {
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
  },
  soundBtn: {
    padding: 4,
  },
  wrongSpelling: {
    fontSize: 13,
    opacity: 0.8,
  },
  deleteButton: {
    padding: 6,
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tapPrompt: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalLoading: {
    padding: 30,
    alignItems: 'center',
  },
  modalEmpty: {
    padding: 30,
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: 320,
  },
  historyItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyResult: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  historyTyped: {
    fontSize: 13,
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 11,
    opacity: 0.5,
  },
});
