import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getAgainWordsList,
  removeAgainWord,
  clearAllAgainWords,
  type AgainWordItem,
} from '@/db/queries/sessions';

export default function AgainScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [words, setWords] = useState<AgainWordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAgainWordsList();
      setWords(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRemove = async (item: AgainWordItem) => {
    await removeAgainWord(item.id);
    setWords((prev) => prev.filter((w) => w.id !== item.id));
  };

  const handleConfirmClearAll = async () => {
    await clearAllAgainWords();
    setWords([]);
    setShowClearConfirm(false);
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Again Words"
        onBack={() => router.back()}
        rightAction={
          words.length > 0 ? (
            <Pressable
              onPress={() => setShowClearConfirm(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.clearIconBtn,
                { backgroundColor: colors.containerLow, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Icon name="delete-sweep" size={20} color="primary" />
            </Pressable>
          ) : undefined
        }
      />

      {loading ? (
        <View style={styles.center}>
          <Txt variant="bodyMd" color="textSecondary">
            Loading…
          </Txt>
        </View>
      ) : words.length === 0 ? (
        <View style={styles.center}>
          <Icon name="check-circle" size={48} color="primary" />
          <Txt variant="labelLg" color="text" style={styles.emptyTitle}>
            No Again Words
          </Txt>
          <Txt variant="bodyMd" color="textSecondary" style={styles.emptyDesc}>
            Words you mark "Again" during practice will appear here and be prioritized in your next session.
          </Txt>
        </View>
      ) : (
        <>
          {/* Summary card */}
          <View style={styles.summaryWrap}>
            <Card tone="low" style={[styles.summaryCard, Shadows.sm]}>
              <Icon name="refresh" size={20} color="primary" />
              <Txt variant="labelMd" color="primary">
                {words.length} word{words.length !== 1 ? 's' : ''} queued for retry
              </Txt>
            </Card>
          </View>

          <FlatList
            data={words}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: colors.outlineVariant }]} />
            )}
            renderItem={({ item }) => (
              <View style={[styles.row, { backgroundColor: colors.card }]}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />

                <View style={styles.rowBody}>
                  <Txt variant="labelLg" color="text">
                    {item.word}
                  </Txt>
                  <Txt variant="labelSm" color="textSecondary">
                    {item.category} · {formatDate(item.spokenAt)}
                  </Txt>
                </View>

                <Pressable
                  onPress={() => handleRemove(item)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.removeBtn,
                    { backgroundColor: colors.containerLow, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Icon name="close" size={16} color={isDark ? '#FFFFFF' : colors.primary} />
                </Pressable>
              </View>
            )}
          />
        </>
      )}

      <ConfirmModal
        visible={showClearConfirm}
        title="Clear Again List?"
        message="Remove all words from the Again list? They will no longer be prioritized."
        iconName="delete-sweep"
        confirmLabel="Clear All"
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { marginTop: 4, textAlign: 'center' },
  emptyDesc: { textAlign: 'center', lineHeight: 20, opacity: 0.7 },
  clearIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryWrap: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
  },
  list: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 0,
    gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowBody: { flex: 1 },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
