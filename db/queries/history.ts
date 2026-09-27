import { getDb } from '../client';
import { sessions, sessionWords, settings } from '../schema';
import { gte, inArray } from 'drizzle-orm';

export async function deleteSessionsSince(days: number): Promise<number> {
  const db = getDb();
  let cutoff = 0;

  if (days === 0) {
    // Today starting at 00:00:00 local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    cutoff = today.getTime();
  } else {
    cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  }

  const matchingSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(gte(sessions.startedAt, cutoff));

  const sessionIds = matchingSessions.map((s) => s.id);
  if (sessionIds.length > 0) {
    await db.delete(sessionWords).where(inArray(sessionWords.sessionId, sessionIds));
    await db.delete(sessions).where(inArray(sessions.id, sessionIds));
  }

  return sessionIds.length;
}

export async function clearAllHistory(): Promise<void> {
  const db = getDb();
  await db.delete(sessionWords);
  await db.delete(sessions);
}

export async function clearAllData(): Promise<void> {
  const db = getDb();
  await db.delete(sessionWords);
  await db.delete(sessions);
  await db.delete(settings);
}
