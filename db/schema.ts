import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const words = sqliteTable('words', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  word: text('word').unique().notNull(),
  category: text('category').notNull(),
  difficulty: text('difficulty').notNull(), // easy, medium, hard
  createdAt: integer('createdAt').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('startedAt').notNull(),
  endedAt: integer('endedAt'),
  durationPlannedSec: integer('durationPlannedSec').notNull(),
  durationActualSec: integer('durationActualSec'),
  category: text('category').notNull(),
  difficulty: text('difficulty').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  correct: integer('correct').default(0).notNull(),
});

export const attempts = sqliteTable('attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('sessionId').notNull(),
  wordId: integer('wordId').notNull(),
  typed: text('typed').notNull(),
  isCorrect: integer('isCorrect', { mode: 'boolean' }).notNull(),
  category: text('category').notNull(),
  difficulty: text('difficulty').notNull(),
  createdAt: integer('createdAt').notNull(),
});

export const mistakes = sqliteTable('mistakes', {
  wordId: integer('wordId').primaryKey().notNull(),
  lastWrongSpelling: text('lastWrongSpelling').notNull(),
  wrongCount: integer('wrongCount').default(1).notNull(),
  correctCount: integer('correctCount').default(0).notNull(),
  lastPracticedAt: integer('lastPracticedAt').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey().notNull(),
  value: text('value').notNull(),
});

// Relations
export const sessionsRelations = relations(sessions, ({ many }) => ({
  attempts: many(attempts),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  session: one(sessions, { fields: [attempts.sessionId], references: [sessions.id] }),
  word: one(words, { fields: [attempts.wordId], references: [words.id] }),
}));

export const mistakesRelations = relations(mistakes, ({ one }) => ({
  word: one(words, { fields: [mistakes.wordId], references: [words.id] }),
}));
