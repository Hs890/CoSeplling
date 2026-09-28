import { getDb } from '../client';
import { attempts, sessions } from '../schema';
import { eq } from 'drizzle-orm';

export async function createSession(
  durationPlannedSec: number,
  category: string,
  difficulty: string
) {
  const db = getDb();
  const result = await db.insert(sessions).values({
    startedAt: Date.now(),
    durationPlannedSec,
    category,
    difficulty,
    attempts: 0,
    correct: 0,
  });
  return result;
}

export async function finalizeSession(
  sessionId: number,
  attempts: number,
  correct: number
): Promise<void> {
  const db = getDb();
  await db
    .update(sessions)
    .set({
      endedAt: Date.now(),
      durationActualSec: Math.floor((Date.now() - (await getSessionStart(sessionId))) / 1000),
      attempts,
      correct,
    })
    .where(eq(sessions.id, sessionId));
}

export async function getSessionStart(sessionId: number): Promise<number> {
  const db = getDb();
  const result = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  return result[0]?.startedAt || Date.now();
}

export async function recordAttempt(
  sessionId: number,
  wordId: number,
  typed: string,
  isCorrect: boolean,
  category: string,
  difficulty: string
): Promise<void> {
  const db = getDb();
  await db.insert(attempts).values({
    sessionId,
    wordId,
    typed,
    isCorrect,
    category,
    difficulty,
    createdAt: Date.now(),
  });
}

export async function getSessionAttempts(sessionId: number) {
  const db = getDb();
  return db.select().from(attempts).where(eq(attempts.sessionId, sessionId));
}
