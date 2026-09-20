import { getDb } from '../db/client';
import { words, attempts, mistakes } from '../db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { generateWords } from './openrouter';
import { getSetting } from '../db/queries/settings';
import { upsertWords, getStoredWordsFiltered, WordItem } from '../db/queries/words';

export interface BuildQueueOptions {
  category: string;
  difficulty: string;
  customCategoryText?: string;
  apiKey?: string;
  model?: string;
  sessionWordIds?: number[];
  mode?: 'normal' | 'mistakes_only';
}

/**
 * Computes adaptive difficulty based on recent attempt accuracy.
 */
export async function getAdaptiveDifficulty(): Promise<'Easy' | 'Medium' | 'Hard'> {
  try {
    const db = getDb();
    const recentAttempts = await db
      .select({ isCorrect: attempts.isCorrect })
      .from(attempts)
      .orderBy(desc(attempts.createdAt))
      .limit(12);

    if (recentAttempts.length < 3) {
      return 'Medium'; // Default baseline
    }

    const correctCount = recentAttempts.filter((a) => a.isCorrect).length;
    const accuracy = correctCount / recentAttempts.length;

    if (accuracy >= 0.8) return 'Hard';
    if (accuracy <= 0.5) return 'Easy';
    return 'Medium';
  } catch {
    return 'Medium';
  }
}

/**
 * Computes adaptive category based on categories with the highest mistake rate.
 */
export async function getAdaptiveCategory(): Promise<string> {
  try {
    const db = getDb();
    const allMistakes = await db
      .select({
        category: words.category,
        wrongCount: mistakes.wrongCount,
      })
      .from(mistakes)
      .innerJoin(words, eq(mistakes.wordId, words.id))
      .orderBy(desc(mistakes.wrongCount))
      .limit(10);

    if (allMistakes.length > 0) {
      // Find category with most mistakes
      const categoryCounts: Record<string, number> = {};
      for (const m of allMistakes) {
        if (m.category && m.category !== 'Adaptive' && m.category !== 'Custom') {
          categoryCounts[m.category] = (categoryCounts[m.category] || 0) + m.wrongCount;
        }
      }

      const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
      if (sortedCategories.length > 0) {
        return sortedCategories[0][0];
      }
    }

    return 'IELTS Listening';
  } catch {
    return 'IELTS Listening';
  }
}

/**
 * Builds a session queue of words with database IDs.
 */
export async function buildSessionQueue(
  category: string,
  difficulty: string,
  apiKey?: string,
  model?: string,
  sessionWordIds: number[] = [],
  mode: 'normal' | 'mistakes_only' = 'normal',
  customCategoryText?: string
): Promise<WordItem[]> {
  const db = getDb();
  const queueSize = 20;
  const lastNToExclude = 15;

  try {
    // 1. If mistakes-only mode, prioritize mistakes table
    if (mode === 'mistakes_only') {
      const allMistakes = await db
        .select({
          id: words.id,
          word: words.word,
          wrongCount: mistakes.wrongCount,
        })
        .from(mistakes)
        .innerJoin(words, eq(mistakes.wordId, words.id))
        .orderBy(desc(mistakes.wrongCount));

      const filtered = allMistakes.filter((w) => !sessionWordIds.includes(w.id));
      if (filtered.length > 0) {
        return filtered.slice(0, queueSize).map((w) => ({ id: w.id, word: w.word }));
      }
      return allMistakes.slice(0, queueSize).map((w) => ({ id: w.id, word: w.word }));
    }

    // 2. Resolve Adaptive Difficulty & Category if requested
    let targetDifficulty = difficulty;
    if (difficulty === 'Adaptive') {
      targetDifficulty = await getAdaptiveDifficulty();
    }

    let targetCategory = category;
    if (category === 'Adaptive') {
      targetCategory = await getAdaptiveCategory();
    } else if (category === 'Custom' && customCategoryText && customCategoryText.trim().length > 0) {
      targetCategory = customCategoryText.trim();
    }

    // 3. Real Repeat Avoidance: Gather actual recent words (strings)
    const recentAttempts = await db
      .select({ wordId: attempts.wordId })
      .from(attempts)
      .orderBy(desc(attempts.createdAt))
      .limit(lastNToExclude);

    const recentIds = Array.from(new Set([...sessionWordIds, ...recentAttempts.map((r) => r.wordId)]));
    
    let excludeWordStrings: string[] = [];
    if (recentIds.length > 0) {
      const recentWordRows = await db
        .select({ word: words.word })
        .from(words)
        .where(inArray(words.id, recentIds.slice(0, 30)));
      excludeWordStrings = recentWordRows.map((r) => r.word);
    }

    const queue: WordItem[] = [];
    const usedWordSet = new Set<string>();

    // 4. Try AI generation if API key is provided
    if (apiKey && apiKey.trim().length > 0) {
      const modelOverride = model || (await getSetting('model')) || 'openai/gpt-4o-mini';
      const aiCount = Math.floor(queueSize * 0.7);

      const aiResponse = await generateWords(apiKey, {
        category: targetCategory,
        difficulty: targetDifficulty,
        count: aiCount,
        exclude: excludeWordStrings,
        model: modelOverride,
      });

      if (aiResponse.words && aiResponse.words.length > 0) {
        // SAVE AI WORDS TO DATABASE and get back their real IDs!
        const savedWords = await upsertWords(aiResponse.words, targetCategory, targetDifficulty);
        for (const w of savedWords) {
          if (!usedWordSet.has(w.word.toLowerCase())) {
            usedWordSet.add(w.word.toLowerCase());
            queue.push(w);
          }
        }
      }
    }

    // 5. Fill remaining slots from Mistakes and Stored / Seed Words
    if (queue.length < queueSize) {
      // First try to add 2-3 mistakes from this or related category
      const mistakeWords = await db
        .select({ id: words.id, word: words.word })
        .from(mistakes)
        .innerJoin(words, eq(mistakes.wordId, words.id))
        .orderBy(desc(mistakes.wrongCount))
        .limit(10);

      for (const m of mistakeWords) {
        if (queue.length >= queueSize) break;
        if (!usedWordSet.has(m.word.toLowerCase()) && !excludeWordStrings.includes(m.word)) {
          usedWordSet.add(m.word.toLowerCase());
          queue.push(m);
        }
      }
    }

    // 6. Fill any remaining queue capacity from local stored / seed words
    if (queue.length < queueSize) {
      const needed = queueSize - queue.length;
      const stored = await getStoredWordsFiltered(
        targetCategory,
        targetDifficulty,
        needed + 5,
        Array.from(usedWordSet)
      );

      for (const item of stored) {
        if (queue.length >= queueSize) break;
        if (!usedWordSet.has(item.word.toLowerCase())) {
          usedWordSet.add(item.word.toLowerCase());
          queue.push(item);
        }
      }
    }

    return queue;
  } catch (error) {
    console.error('Failed to build queue, falling back to stored words:', error);
    return await getStoredWordsFiltered('Everyday English', 'Medium', queueSize);
  }
}
