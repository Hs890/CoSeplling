import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StatTile } from '@/components/StatTile';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getStats, getRecentSessions } from '@/db/queries/stats';

interface RecentSession {
  id: number;
  startedAt: number;
  endedAt: number | null;
  durationActualSec: number | null;
  category: string;
  difficulty: string;
  attempts: number;
  correct: number;
}

export default function Dashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [stats, setStats] = useState({
    totalAttempts: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    mistakesCount: 0,
    totalTimeSec: 0,
    totalSessions: 0,
  });

  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const data = await getStats();
          const recents = await getRecentSessions(5);
          if (active) {
            setStats(data);
            setRecentSessions(recents as RecentSession[]);
          }
        } catch (error) {
          console.error('Failed to load dashboard data:', error);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (timestamp: number): string => {
    const d = new Date(timestamp);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Action Button */}
        <View style={styles.quickActionRow}>
          <View style={{ flex: 1, marginRight: stats.mistakesCount > 0 ? 8 : 0 }}>
            <PrimaryButton
              label="▶ Start Practice"
              onPress={() => router.push('/practice' as any)}
              style={{ marginVertical: 0 }}
            />
          </View>
          {stats.mistakesCount > 0 && (
            <View style={{ flex: 1, marginLeft: 8 }}>
              <PrimaryButton
                label={`Review Mistakes (${stats.mistakesCount})`}
                variant="danger"
                onPress={() => router.push({ pathname: '/practice', params: { mode: 'mistakes' } } as any)}
                style={{ marginVertical: 0 }}
              />
            </View>
          )}
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>
          <View style={styles.statsGrid}>
            <StatTile label="Total" value={stats.totalAttempts} />
            <StatTile label="Correct" value={stats.correct} color={colors.success} />
            <StatTile label="Wrong" value={stats.wrong} color={colors.danger} />
            <StatTile label="Accuracy" value={`${stats.accuracy}%`} />
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Progress</ThemedText>
          <View style={styles.statsGrid}>
            <StatTile label="To Review" value={stats.mistakesCount} color={colors.warning} />
            <StatTile label="Sessions" value={stats.totalSessions} />
            <StatTile label="Total Time" value={formatTime(stats.totalTimeSec)} />
          </View>
        </View>

        {/* Recent Sessions Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recent Sessions</ThemedText>
          {recentSessions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>No completed sessions yet.</ThemedText>
            </Card>
          ) : (
            recentSessions.map((session) => {
              const sessionAcc =
                session.attempts > 0
                  ? Math.round((session.correct / session.attempts) * 100)
                  : 0;

              return (
                <Card key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <ThemedText style={styles.sessionDate}>
                      {formatDate(session.startedAt)}
                    </ThemedText>
                    <ThemedText style={[styles.sessionBadge, { color: colors.tint }]}>
                      {session.category} • {session.difficulty}
                    </ThemedText>
                  </View>
                  <View style={styles.sessionStatsRow}>
                    <ThemedText style={styles.sessionScore}>
                      Score: <ThemedText style={{ fontWeight: '700' }}>{session.correct}/{session.attempts}</ThemedText> ({sessionAcc}%)
                    </ThemedText>
                    <ThemedText style={styles.sessionDuration}>
                      ⏱️ {formatTime(session.durationActualSec || 0)}
                    </ThemedText>
                  </View>
                </Card>
              );
            })
          )}
        </View>
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
    paddingBottom: 32,
  },
  quickActionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sessionCard: {
    marginBottom: 10,
    paddingVertical: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 13,
    opacity: 0.7,
  },
  sessionBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionScore: {
    fontSize: 15,
  },
  sessionDuration: {
    fontSize: 13,
    opacity: 0.8,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
