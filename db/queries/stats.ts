import { getDb } from '../client';
import { attempts, sessions, mistakes } from '../schema';
import { count, sum, eq } from 'drizzle-orm';

export async function getStats() {
  const db = getDb();

  const totalAttemptsResult = await db
    .select({ value: count() })
    .from(attempts);
  const totalAttempts = totalAttemptsResult[0]?.value || 0;

  const correctAttemptsResult = await db
    .select({ value: count() })
    .from(attempts);

  const allAttempts = await db.select().from(attempts);
  const correctCount = allAttempts.filter(a => a.isCorrect).length;

  const wrongCount = totalAttempts - correctCount;

  const sessionsResult = await db
    .select({ value: count() })
    .from(sessions);
  const totalSessions = sessionsResult[0]?.value || 0;

  const allSessions = await db.select().from(sessions);
  const totalTimeSec = allSessions.reduce((sum, s) => sum + (s.durationActualSec || 0), 0);

  const mistakesCountResult = await db
    .select({ value: count() })
    .from(mistakes);
  const mistakesCount = mistakesCountResult[0]?.value || 0;

  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  return {
    totalAttempts,
    correct: correctCount,
    wrong: wrongCount,
    accuracy,
    mistakesCount,
    totalTimeSec,
    totalSessions,
  };
}

export async function getRecentSessions(limit: number = 5) {
  const db = getDb();
  const allSessions = await db.select().from(sessions);
  return allSessions
    .filter(s => s.endedAt)
    .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))
    .slice(0, limit);
}
