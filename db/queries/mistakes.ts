import { getDb } from '../client';
import { mistakes, words, attempts } from '../schema';
import { eq, like, and, desc, asc } from 'drizzle-orm';

export type MistakeSortOption = 'wrong' | 'recent' | 'accuracy' | 'alphabetical';

export async function getMistakes(search?: string, sortBy: MistakeSortOption = 'wrong') {
  const db = getDb();
  const conditions = search ? [like(words.word, `%${search.trim().toLowerCase()}%`)] : [];

  const rows = await db
    .select({
      wordId: mistakes.wordId,
      word: words.word,
      lastWrongSpelling: mistakes.lastWrongSpelling,
      wrongCount: mistakes.wrongCount,
      correctCount: mistakes.correctCount,
      lastPracticedAt: mistakes.lastPracticedAt,
    })
    .from(mistakes)
    .innerJoin(words, eq(mistakes.wordId, words.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // In-memory sorting for all sort variants
  if (sortBy === 'wrong') {
    rows.sort((a, b) => b.wrongCount - a.wrongCount || b.lastPracticedAt - a.lastPracticedAt);
  } else if (sortBy === 'recent') {
    rows.sort((a, b) => b.lastPracticedAt - a.lastPracticedAt);
  } else if (sortBy === 'accuracy') {
    rows.sort((a, b) => {
      const accA = a.wrongCount / (a.wrongCount + a.correctCount || 1);
      const accB = b.wrongCount / (b.wrongCount + b.correctCount || 1);
      return accB - accA;
    });
  } else if (sortBy === 'alphabetical') {
    rows.sort((a, b) => a.word.localeCompare(b.word));
  }

  return rows;
}

export async function upsertMistake(
  wordId: number,
  word: string,
  typed: string,
  isCorrect: boolean
): Promise<void> {
  const db = getDb();
  const now = Date.now();

  if (isCorrect) {
    // If word exists in mistakes table, increment correct count
    const existing = await db.select().from(mistakes).where(eq(mistakes.wordId, wordId));
    if (existing.length > 0) {
      await db
        .update(mistakes)
        .set({
          correctCount: existing[0].correctCount + 1,
          lastPracticedAt: now,
        })
        .where(eq(mistakes.wordId, wordId));
    }
  } else {
    // Upsert: insert or increment wrong count
    const existing = await db.select().from(mistakes).where(eq(mistakes.wordId, wordId));
    if (existing.length > 0) {
      await db
        .update(mistakes)
        .set({
          lastWrongSpelling: typed,
          wrongCount: existing[0].wrongCount + 1,
          lastPracticedAt: now,
        })
        .where(eq(mistakes.wordId, wordId));
    } else {
      await db.insert(mistakes).values({
        wordId,
        lastWrongSpelling: typed,
        wrongCount: 1,
        correctCount: 0,
        lastPracticedAt: now,
      });
    }
  }
}

export async function deleteMistake(wordId: number): Promise<void> {
  const db = getDb();
  await db.delete(mistakes).where(eq(mistakes.wordId, wordId));
}

export async function getMistakeHistory(wordId: number) {
  const db = getDb();
  return db
    .select({
      id: attempts.id,
      sessionId: attempts.sessionId,
      wordId: attempts.wordId,
      typed: attempts.typed,
      isCorrect: attempts.isCorrect,
      category: attempts.category,
      difficulty: attempts.difficulty,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .where(eq(attempts.wordId, wordId))
    .orderBy(desc(attempts.createdAt));
}
