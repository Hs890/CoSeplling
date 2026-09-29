import { getDb } from '../client';
import { words } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export interface WordItem {
  id: number;
  word: string;
}

// Built-in starter word bank for offline practice across IELTS categories and difficulties
export const OFFLINE_SEED_WORDS: Array<{ word: string; category: string; difficulty: string }> = [
  // Everyday English
  { word: 'calendar', category: 'Everyday English', difficulty: 'Easy' },
  { word: 'schedule', category: 'Everyday English', difficulty: 'Medium' },
  { word: 'receipt', category: 'Everyday English', difficulty: 'Medium' },
  { word: 'restaurant', category: 'Everyday English', difficulty: 'Medium' },
  { word: 'neighborhood', category: 'Everyday English', difficulty: 'Hard' },
  { word: 'convenient', category: 'Everyday English', difficulty: 'Hard' },
  { word: 'grocery', category: 'Everyday English', difficulty: 'Easy' },
  { word: 'appointment', category: 'Everyday English', difficulty: 'Medium' },
  { word: 'umbrella', category: 'Everyday English', difficulty: 'Easy' },
  { word: 'library', category: 'Everyday English', difficulty: 'Easy' },
  // IELTS Listening
  { word: 'accommodation', category: 'IELTS Listening', difficulty: 'Hard' },
  { word: 'questionnaire', category: 'IELTS Listening', difficulty: 'Hard' },
  { word: 'environment', category: 'IELTS Listening', difficulty: 'Medium' },
  { word: 'government', category: 'IELTS Listening', difficulty: 'Medium' },
  { word: 'parliament', category: 'IELTS Listening', difficulty: 'Hard' },
  { word: 'maintenance', category: 'IELTS Listening', difficulty: 'Medium' },
  { word: 'temperature', category: 'IELTS Listening', difficulty: 'Medium' },
  { word: 'laboratory', category: 'IELTS Listening', difficulty: 'Medium' },
  { word: 'brochure', category: 'IELTS Listening', difficulty: 'Hard' },
  { word: 'catalogue', category: 'IELTS Listening', difficulty: 'Hard' },
  // Education
  { word: 'curriculum', category: 'Education', difficulty: 'Hard' },
  { word: 'assessment', category: 'Education', difficulty: 'Medium' },
  { word: 'assignment', category: 'Education', difficulty: 'Easy' },
  { word: 'dissertation', category: 'Education', difficulty: 'Hard' },
  { word: 'scholarship', category: 'Education', difficulty: 'Medium' },
  { word: 'semester', category: 'Education', difficulty: 'Easy' },
  { word: 'tutorial', category: 'Education', difficulty: 'Easy' },
  { word: 'professor', category: 'Education', difficulty: 'Easy' },
  { word: 'attendance', category: 'Education', difficulty: 'Medium' },
  // Accommodation
  { word: 'dormitory', category: 'Accommodation', difficulty: 'Medium' },
  { word: 'balcony', category: 'Accommodation', difficulty: 'Easy' },
  { word: 'apartment', category: 'Accommodation', difficulty: 'Easy' },
  { word: 'residence', category: 'Accommodation', difficulty: 'Medium' },
  { word: 'furnished', category: 'Accommodation', difficulty: 'Medium' },
  { word: 'utilities', category: 'Accommodation', difficulty: 'Medium' },
  { word: 'landlord', category: 'Accommodation', difficulty: 'Easy' },
  // Transport
  { word: 'commute', category: 'Transport', difficulty: 'Easy' },
  { word: 'passenger', category: 'Transport', difficulty: 'Medium' },
  { word: 'pedestrian', category: 'Transport', difficulty: 'Medium' },
  { word: 'timetable', category: 'Transport', difficulty: 'Easy' },
  { word: 'terminal', category: 'Transport', difficulty: 'Medium' },
  { word: 'underground', category: 'Transport', difficulty: 'Easy' },
  { word: 'departure', category: 'Transport', difficulty: 'Easy' },
  // Work
  { word: 'colleague', category: 'Work', difficulty: 'Medium' },
  { word: 'supervisor', category: 'Work', difficulty: 'Medium' },
  { word: 'management', category: 'Work', difficulty: 'Easy' },
  { word: 'employment', category: 'Work', difficulty: 'Easy' },
  { word: 'conference', category: 'Work', difficulty: 'Medium' },
  { word: 'negotiation', category: 'Work', difficulty: 'Hard' },
  { word: 'presentation', category: 'Work', difficulty: 'Easy' },
  // Places
  { word: 'monument', category: 'Places', difficulty: 'Easy' },
  { word: 'cathedral', category: 'Places', difficulty: 'Medium' },
  { word: 'boulevard', category: 'Places', difficulty: 'Hard' },
  { word: 'suburb', category: 'Places', difficulty: 'Easy' },
  { word: 'exhibition', category: 'Places', difficulty: 'Medium' },
  { word: 'gymnasium', category: 'Places', difficulty: 'Medium' },
  // Names
  { word: 'Christopher', category: 'Names', difficulty: 'Medium' },
  { word: 'Elizabeth', category: 'Names', difficulty: 'Medium' },
  { word: 'Alexander', category: 'Names', difficulty: 'Medium' },
  { word: 'Katherine', category: 'Names', difficulty: 'Medium' },
  { word: 'Jonathan', category: 'Names', difficulty: 'Easy' },
  { word: 'Margaret', category: 'Names', difficulty: 'Medium' },
];

/**
 * Ensures a list of words exist in the words table.
 * Inserts missing ones and returns array of { id, word }.
 */
export async function upsertWords(
  rawWords: string[],
  category: string,
  difficulty: string
): Promise<WordItem[]> {
  const db = getDb();
  const normalizedWords = Array.from(
    new Set(rawWords.map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 2))
  );

  if (normalizedWords.length === 0) return [];

  const results: WordItem[] = [];

  for (const wordStr of normalizedWords) {
    try {
      const existing = await db
        .select({ id: words.id, word: words.word })
        .from(words)
        .where(eq(words.word, wordStr))
        .limit(1);

      if (existing.length > 0) {
        results.push(existing[0]);
      } else {
        const insertRes = await db.insert(words).values({
          word: wordStr,
          category,
          difficulty,
          createdAt: Date.now(),
        });
        results.push({
          id: insertRes.lastInsertRowId as number,
          word: wordStr,
        });
      }
    } catch (e) {
      // In case of unique collision race condition, query again
      const fallback = await db
        .select({ id: words.id, word: words.word })
        .from(words)
        .where(eq(words.word, wordStr))
        .limit(1);
      if (fallback.length > 0) {
        results.push(fallback[0]);
      }
    }
  }

  return results;
}

/**
 * Seeds default offline words if the words table is empty.
 */
export async function ensureSeedWords(): Promise<void> {
  const db = getDb();
  const countRes = await db.select({ id: words.id }).from(words).limit(1);
  if (countRes.length === 0) {
    for (const item of OFFLINE_SEED_WORDS) {
      try {
        await db.insert(words).values({
          word: item.word.toLowerCase(),
          category: item.category,
          difficulty: item.difficulty,
          createdAt: Date.now(),
        });
      } catch {
        // ignore unique constraint
      }
    }
  }
}

/**
 * Gets stored words from DB matching category & difficulty, excluding specific words.
 */
export async function getStoredWordsFiltered(
  category: string,
  difficulty: string,
  limit: number = 20,
  excludeWordStrings: string[] = []
): Promise<WordItem[]> {
  const db = getDb();
  await ensureSeedWords();

  const all = await db.select({ id: words.id, word: words.word, category: words.category, difficulty: words.difficulty }).from(words);
  const excludeSet = new Set(excludeWordStrings.map((w) => w.toLowerCase()));

  let filtered = all.filter((w) => !excludeSet.has(w.word.toLowerCase()));

  if (category !== 'Adaptive' && category !== 'Custom') {
    const categoryMatches = filtered.filter((w) => w.category === category);
    if (categoryMatches.length > 0) {
      filtered = categoryMatches;
    }
  }

  if (difficulty !== 'Adaptive') {
    const diffMatches = filtered.filter((w) => w.difficulty === difficulty);
    if (diffMatches.length > 0) {
      filtered = diffMatches;
    }
  }

  // Shuffle slightly for variety
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit).map((w) => ({ id: w.id, word: w.word }));
}
