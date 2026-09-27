import { openDatabaseAsync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './migrations/migrations';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export async function initializeDb() {
  const sqliteDb = await openDatabaseAsync('spelling.db');
  db = drizzle(sqliteDb, { schema });

  try {
    await migrate(db, migrations);
  } catch (e) {
    console.warn('Drizzle migrate error (applying direct schema fallback):', e);
    // Direct DDL fallback to guarantee tables exist across platforms
    await sqliteDb.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        startedAt INTEGER NOT NULL,
        endedAt INTEGER,
        durationPlannedSec INTEGER NOT NULL,
        durationActualSec INTEGER,
        intervalSec INTEGER NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS session_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        sessionId INTEGER NOT NULL,
        position INTEGER NOT NULL,
        word TEXT NOT NULL,
        spokenAt INTEGER NOT NULL,
        mark TEXT
      );
      CREATE INDEX IF NOT EXISTS session_words_session_idx ON session_words (sessionId);
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
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
