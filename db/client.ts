import { openDatabaseAsync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './migrations/migrations';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export async function initializeDb() {
  const sqliteDb = await openDatabaseAsync('ielts.db');
  db = drizzle(sqliteDb, { schema });

  try {
    await migrate(db, migrations);
  } catch (e) {
    console.warn('Drizzle migrate error (applying direct schema fallback):', e);
    // Direct DDL fallback to guarantee tables exist across all platforms / bundles
    await sqliteDb.execAsync(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        word TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        startedAt INTEGER NOT NULL,
        endedAt INTEGER,
        durationPlannedSec INTEGER NOT NULL,
        durationActualSec INTEGER,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        correct INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        sessionId INTEGER NOT NULL,
        wordId INTEGER NOT NULL,
        typed TEXT NOT NULL,
        isCorrect INTEGER NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS mistakes (
        wordId INTEGER PRIMARY KEY NOT NULL,
        lastWrongSpelling TEXT NOT NULL,
        wrongCount INTEGER NOT NULL DEFAULT 1,
        correctCount INTEGER NOT NULL DEFAULT 0,
        lastPracticedAt INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS words_word_unique ON words (word);
    `);
  }

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDb() first.');
  }
  return db;
}

