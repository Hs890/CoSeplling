import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('startedAt').notNull(),
  endedAt: integer('endedAt'),
  durationPlannedSec: integer('durationPlannedSec').notNull(),
  durationActualSec: integer('durationActualSec'),
  intervalSec: integer('intervalSec').notNull(),
  category: text('category').notNull(),
  difficulty: text('difficulty').notNull(),
});

export const sessionWords = sqliteTable(
  'session_words',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: integer('sessionId').notNull(),
    position: integer('position').notNull(),
    word: text('word').notNull(),
    spokenAt: integer('spokenAt').notNull(),
    mark: text('mark'), // 'correct' | 'retest' | null
  },
  (t) => [index('session_words_session_idx').on(t.sessionId)]
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey().notNull(),
  value: text('value').notNull(),
});
