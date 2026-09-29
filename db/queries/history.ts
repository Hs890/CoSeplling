import { getDb } from '../client';
import { attempts, sessions, mistakes, words, settings } from '../schema';
import { eq, gte } from 'drizzle-orm';

/**
 * Recomputes every mistakes row from the attempts that remain, and drops
 * rows with no wrong attempts left. Call after any attempt deletion.
 */
async function reconcileMistakes(): Promise<void> {
  const db = getDb();
  const [allMistakes, allAttempts] = await Promise.all([
    db.select().from(mistakes),
    db.select().from(attempts),
  ]);

  const byWord = new Map<number, typeof allAttempts>();
  for (const a of allAttempts) {
    const list = byWord.get(a.wordId);
    if (list) list.push(a);
    else byWord.set(a.wordId, [a]);
  }

  for (const m of allMistakes) {
    const list = (byWord.get(m.wordId) ?? []).sort((a, b) => b.createdAt - a.createdAt);
    const wrong = list.filter((a) => !a.isCorrect);
    if (wrong.length === 0) {
      await db.delete(mistakes).where(eq(mistakes.wordId, m.wordId));
      continue;
    }
    await db
      .update(mistakes)
      .set({
        wrongCount: wrong.length,
        correctCount: list.length - wrong.length,
        lastWrongSpelling: wrong[0].typed,
        lastPracticedAt: list[0].createdAt,
      })
      .where(eq(mistakes.wordId, m.wordId));
  }
}

/**
 * Deletes attempts and sessions from the last N days (or starting today).
 */
export async function deleteHistoryByDays(days: number): Promise<{ attemptsDeleted: number; sessionsDeleted: number }> {
  const db = getDb();
  let cutoff = 0;
  if (days === 0) {
    // Today starting at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    cutoff = today.getTime();
  } else {
    cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  }

  const attemptsRes = await db.delete(attempts).where(gte(attempts.createdAt, cutoff));
  const sessionsRes = await db.delete(sessions).where(gte(sessions.startedAt, cutoff));
  await reconcileMistakes();

  return {
    attemptsDeleted: (attemptsRes as any).changes || 0,
    sessionsDeleted: (sessionsRes as any).changes || 0,
  };
}

/**
 * Clears all attempts from the database.
 */
export async function clearAttempts(): Promise<void> {
  const db = getDb();
  await db.delete(attempts);
  await reconcileMistakes();
}

/**
 * Clears all sessions from the database.
 */
export async function clearSessions(): Promise<void> {
  const db = getDb();
  await db.delete(sessions);
}

/**
 * Clears all mistakes from the database.
 */
export async function clearMistakes(): Promise<void> {
  const db = getDb();
  await db.delete(mistakes);
}

/**
 * Clears all history (attempts, sessions, mistakes).
 */
export async function clearAllHistory(): Promise<void> {
  const db = getDb();
  await db.delete(attempts);
  await db.delete(sessions);
  await db.delete(mistakes);
}

/**
 * Clears all app data (attempts, sessions, mistakes, words, settings).
 */
export async function clearAllData(): Promise<void> {
  const db = getDb();
  await db.delete(attempts);
  await db.delete(sessions);
  await db.delete(mistakes);
  await db.delete(words);
  await db.delete(settings);
}
