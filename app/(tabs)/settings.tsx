import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSetting, setSetting } from '@/db/queries/settings';
import { getApiKey, saveApiKey, deleteApiKey, testApiKey } from '@/lib/secureKey';
import { speakWord } from '@/lib/tts';
import {
  deleteHistoryByDays,
  clearAttempts,
  clearSessions,
  clearMistakes,
  clearAllHistory,
  clearAllData,
} from '@/db/queries/history';
import { CATEGORIES, DIFFICULTIES, DURATIONS, DEFAULT_MODEL } from '@/lib/constants';

const SPEECH_RATES = [0.5, 0.75, 1.0, 1.1, 1.2];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [testingKey, setTestingKey] = useState(false);

  // Model and defaults state
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [defaultDuration, setDefaultDuration] = useState('10');
  const [defaultCategory, setDefaultCategory] = useState('Everyday English');
  const [difficulty, setDifficulty] = useState('Medium');
  const [speechRate, setSpeechRate] = useState(1.0);

  const loadSettings = useCallback(async () => {
    try {
      const key = await getApiKey();
      if (key && key.trim().length > 0) {
        setApiKey(key);
        setHasSavedKey(true);
        const preview = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '••••••••';
        setMaskedKey(preview);
      } else {
        setApiKey('');
        setHasSavedKey(false);
        setMaskedKey('');
      }

      const m = await getSetting('model');
      if (m) setModel(m);

      const dur = await getSetting('defaultDuration');
      if (dur) setDefaultDuration(dur);

      const cat = await getSetting('defaultCategory');
      if (cat) setDefaultCategory(cat);

      const diff = await getSetting('difficulty');
      if (diff) setDifficulty(diff);

      const rate = await getSetting('speechRate');
      if (rate) setSpeechRate(parseFloat(rate) || 1.0);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleTestKeyOnly = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      Alert.alert('Missing Key', 'Please enter an API key to test.');
      return;
    }

    setTestingKey(true);
    try {
      const valid = await testApiKey(keyToTest);
      if (valid) {
        Alert.alert('Success ✅', 'API key is valid and working with OpenRouter!');
      } else {
        Alert.alert('Failed ❌', 'Invalid API key or network error. Please check your key.');
      }
    } catch {
      Alert.alert('Error', 'Unable to reach OpenRouter API.');
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveKey = async () => {
    const keyToSave = apiKey.trim();
    if (!keyToSave) {
      Alert.alert('Missing Key', 'Please enter an API key.');
      return;
    }

    setTestingKey(true);
    try {
      const valid = await testApiKey(keyToSave);
      if (!valid) {
        Alert.alert(
          'Verification Warning',
          'The key could not be verified with OpenRouter. Do you want to save it anyway?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save Anyway',
              onPress: async () => {
                await saveApiKey(keyToSave);
                setHasSavedKey(true);
                const preview = keyToSave.length > 8 ? `${keyToSave.slice(0, 4)}...${keyToSave.slice(-4)}` : '••••••••';
                setMaskedKey(preview);
                Alert.alert('Saved', 'API key saved.');
              },
            },
          ]
        );
        return;
      }

      await saveApiKey(keyToSave);
      setHasSavedKey(true);
      const preview = keyToSave.length > 8 ? `${keyToSave.slice(0, 4)}...${keyToSave.slice(-4)}` : '••••••••';
      setMaskedKey(preview);
      Alert.alert('Success ✅', 'API key verified and saved successfully!');
    } catch {
      Alert.alert('Error', 'Failed to save API key.');
    } finally {
      setTestingKey(false);
    }
  };

  const handleClearKey = async () => {
    Alert.alert('Delete API Key', 'Remove your saved OpenRouter API key? The app will revert to offline word bank.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteApiKey();
          setApiKey('');
          setHasSavedKey(false);
          setMaskedKey('');
          Alert.alert('Key Removed', 'API key deleted.');
        },
      },
    ]);
  };

  const handleTestSpeech = async () => {
    await speakWord('Accommodation', speechRate);
  };

  const handleSavePreferences = async () => {
    try {
      await setSetting('model', model.trim() || DEFAULT_MODEL);
      await setSetting('defaultDuration', defaultDuration);
      await setSetting('defaultCategory', defaultCategory);
      await setSetting('difficulty', difficulty);
      await setSetting('speechRate', speechRate.toString());
      Alert.alert('Success ✅', 'Preferences saved successfully!');
    } catch {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  // Data management actions
  const handleDeleteDays = (days: number, label: string) => {
    Alert.alert(`Delete ${label}`, `Are you sure you want to delete all practice history for ${label.toLowerCase()}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHistoryByDays(days);
            Alert.alert('Success', `History for ${label.toLowerCase()} deleted.`);
          } catch {
            Alert.alert('Error', 'Failed to delete history.');
          }
        },
      },
    ]);
  };

  const handleClearSection = (action: 'attempts' | 'sessions' | 'mistakes') => {
    const titles = {
      attempts: 'Clear All Attempts',
      sessions: 'Clear All Sessions',
      mistakes: 'Clear All Mistakes',
    };

    Alert.alert(titles[action], `This will permanently clear all recorded ${action}. Are you sure?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            if (action === 'attempts') await clearAttempts();
            if (action === 'sessions') await clearSessions();
            if (action === 'mistakes') await clearMistakes();
            Alert.alert('Cleared', `${titles[action]} completed.`);
          } catch {
            Alert.alert('Error', `Failed to clear ${action}.`);
          }
        },
      },
    ]);
  };

  const handleClearAllHistory = () => {
    Alert.alert(
      'Delete All History',
      'This will delete all sessions, attempts, and recorded mistakes. Your settings and API key will remain intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All History',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllHistory();
              Alert.alert('Success', 'All practice history deleted.');
            } catch {
              Alert.alert('Error', 'Failed to delete history.');
            }
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Clear All Data (Factory Reset)',
      'This will permanently wipe all sessions, attempts, mistakes, cached words, stored settings, and your saved OpenRouter API key. This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'WIPE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApiKey();
              await clearAllData();
              await loadSettings();
              Alert.alert('Reset Complete', 'All app data has been cleared.');
            } catch {
              Alert.alert('Error', 'Failed to clear all data.');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Status Notice */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: hasSavedKey ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 149, 0, 0.12)',
              borderColor: hasSavedKey ? colors.success : colors.warning,
            },
          ]}
        >
          <ThemedText style={styles.statusBannerTitle}>
            {hasSavedKey ? '🟢 AI Generation Active' : '🟠 Offline Mode Active'}
          </ThemedText>
          <ThemedText style={styles.statusBannerText}>
            {hasSavedKey
              ? 'OpenRouter API is configured. Word queues will be generated dynamically.'
              : 'No API key configured. The app is using the on-device IELTS word bank.'}
          </ThemedText>
        </View>

        {/* API Key Section */}
        <Card>
          <ThemedText style={styles.sectionTitle}>OpenRouter API Key</ThemedText>
          {hasSavedKey ? (
            <View style={styles.keyDisplay}>
              <ThemedText style={styles.keyMasked}>Key: {maskedKey}</ThemedText>
              <View style={styles.keyActionRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <PrimaryButton
                    label={testingKey ? 'Testing...' : 'Test Key'}
                    onPress={handleTestKeyOnly}
                    disabled={testingKey}
                    style={{ marginVertical: 0 }}
                  />
                </View>
                <View style={{ flex: 1, marginHorizontal: 3 }}>
                  <PrimaryButton
                    label="Change"
                    onPress={() => setHasSavedKey(false)}
                    style={{ marginVertical: 0 }}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <PrimaryButton
                    label="Delete"
                    variant="danger"
                    onPress={handleClearKey}
                    style={{ marginVertical: 0 }}
                  />
                </View>
              </View>
            </View>
          ) : (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
                    color: colors.text,
                    borderColor: colors.icon,
                  },
                ]}
                placeholder="sk-or-v1-..."
                placeholderTextColor={colors.icon}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.keyActionRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <PrimaryButton
                    label={testingKey ? 'Testing...' : 'Test Key'}
                    onPress={handleTestKeyOnly}
                    disabled={testingKey || !apiKey.trim()}
                    style={{ marginVertical: 0 }}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <PrimaryButton
                    label="Save Key"
                    onPress={handleSaveKey}
                    disabled={testingKey || !apiKey.trim()}
                    style={{ marginVertical: 0 }}
                  />
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Model Selection */}
        <Card>
          <ThemedText style={styles.sectionTitle}>OpenRouter Model</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
                color: colors.text,
                borderColor: colors.icon,
              },
            ]}
            placeholder="openai/gpt-4o-mini"
            placeholderTextColor={colors.icon}
            value={model}
            onChangeText={setModel}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Card>

        {/* Default Duration */}
        <Card>
          <ThemedText style={styles.sectionTitle}>Default Duration</ThemedText>
          <View style={styles.chipRow}>
            {[...DURATIONS].map((d) => (
              <Chip
                key={d}
                label={`${d} min`}
                selected={defaultDuration === d.toString()}
                onPress={() => setDefaultDuration(d.toString())}
              />
            ))}
          </View>
        </Card>

        {/* Default Category */}
        <Card>
          <ThemedText style={styles.sectionTitle}>Default Category</ThemedText>
          <View style={styles.chipRow}>
            {CATEGORIES.filter((c) => c !== 'Custom').map((c) => (
              <Chip
                key={c}
                label={c}
                selected={defaultCategory === c}
                onPress={() => setDefaultCategory(c)}
              />
            ))}
          </View>
        </Card>

        {/* Default Difficulty */}
        <Card>
          <ThemedText style={styles.sectionTitle}>Default Difficulty</ThemedText>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((d) => (
              <Chip
                key={d}
                label={d}
                selected={difficulty === d}
                onPress={() => setDifficulty(d)}
              />
            ))}
          </View>
        </Card>

        {/* Speech Rate */}
        <Card>
          <ThemedText style={styles.sectionTitle}>Speech Rate ({speechRate.toFixed(2)}x)</ThemedText>
          <View style={styles.chipRow}>
            {SPEECH_RATES.map((r) => (
              <Chip
                key={r}
                label={`${r}x`}
                selected={speechRate === r}
                onPress={() => setSpeechRate(r)}
              />
            ))}
          </View>
          <PrimaryButton
            label="🔊 Test Speech Speed"
            onPress={handleTestSpeech}
            style={{ marginTop: 8, marginHorizontal: 0 }}
          />
        </Card>

        {/* Save Preferences Button */}
        <PrimaryButton
          label="Save App Preferences"
          onPress={handleSavePreferences}
          style={{ marginVertical: 12 }}
        />

        {/* Data Management Section */}
        <Card style={styles.dataCard}>
          <ThemedText style={[styles.sectionTitle, { color: colors.danger }]}>
            Data Management
          </ThemedText>
          <ThemedText style={styles.dataSubText}>
            Manage and clear your local practice history and stored data.
          </ThemedText>

          {/* Time range deletions */}
          <View style={styles.dataGroup}>
            <ThemedText style={styles.dataGroupTitle}>Delete by Time Range</ThemedText>
            <View style={styles.buttonGrid}>
              <View style={styles.gridBtn}>
                <PrimaryButton
                  label="Today"
                  variant="danger"
                  onPress={() => handleDeleteDays(0, "Today's History")}
                  style={styles.compactBtn}
                />
              </View>
              <View style={styles.gridBtn}>
                <PrimaryButton
                  label="Last 7 Days"
                  variant="danger"
                  onPress={() => handleDeleteDays(7, 'Last 7 Days')}
                  style={styles.compactBtn}
                />
              </View>
              <View style={styles.gridBtn}>
                <PrimaryButton
                  label="Last 30 Days"
                  variant="danger"
                  onPress={() => handleDeleteDays(30, 'Last 30 Days')}
                  style={styles.compactBtn}
                />
              </View>
              <View style={styles.gridBtn}>
                <PrimaryButton
                  label="Last 90 Days"
                  variant="danger"
                  onPress={() => handleDeleteDays(90, 'Last 90 Days')}
                  style={styles.compactBtn}
                />
              </View>
            </View>
          </View>

          {/* Table specific clearing */}
          <View style={styles.dataGroup}>
            <ThemedText style={styles.dataGroupTitle}>Clear Specific Records</ThemedText>
            <View style={styles.buttonGrid}>
              <View style={styles.gridBtn}>
                <PrimaryButton
                  label="Clear Attempts"
                  variant="danger"
                  onPress={() => handleClearSection('attempts')}
                  style={styles.compactBtn}
                />
              </View>
              <View style={styles.gridBtn}>
                <PrimaryButton
                  label="Clear Sessions"
                  variant="danger"
                  onPress={() => handleClearSection('sessions')}
                  style={styles.compactBtn}
                />
              </View>
              <View style={styles.gridBtn}>
                <PrimaryButton
                  label="Clear Mistakes"
                  variant="danger"
                  onPress={() => handleClearSection('mistakes')}
                  style={styles.compactBtn}
                />
              </View>
              <View style={styles.gridBtn}>
                <PrimaryButton
                  label="All History"
                  variant="danger"
                  onPress={handleClearAllHistory}
                  style={styles.compactBtn}
                />
              </View>
            </View>
          </View>

          {/* Full Wipe */}
          <View style={styles.wipeBox}>
            <PrimaryButton
              label="⚠️ Clear All Data (Factory Reset)"
              variant="danger"
              onPress={handleClearAllData}
              style={{ marginHorizontal: 0 }}
            />
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  statusBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusBannerText: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  keyDisplay: {
    paddingVertical: 4,
  },
  keyMasked: {
    fontSize: 15,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  keyActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataCard: {
    marginTop: 8,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  dataSubText: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 14,
  },
  dataGroup: {
    marginBottom: 16,
  },
  dataGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridBtn: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  compactBtn: {
    marginVertical: 0,
    marginHorizontal: 0,
    paddingVertical: 8,
  },
  wipeBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 59, 48, 0.3)',
  },
});
