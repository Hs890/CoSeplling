# IELTS Listening Spelling Practice

A paper-and-pencil listening drill for IELTS spelling. The app speaks a new word every few seconds, never shows it, and saves the full word list so you can check your handwriting afterwards.

Built with **Expo SDK 57** (React Native 0.86, React 19), **expo-router**, **expo-sqlite + Drizzle ORM**, **expo-speech**, and **Google Gemini** for AI word generation. No backend, no accounts: everything except the Gemini requests stays on the device.

**Workflow:** set category, difficulty, word interval and session time → start → listen and write on paper → session ends → open the saved word list and self-check.

## Features

- **Practice**: categories (Everyday English, IELTS Listening, Education, Accommodation, Transport, Work, Places, Names, Custom, Adaptive), difficulty (Easy / Medium / Hard / Adaptive), word interval (5 / 10 / 15 / 30 s or custom) and session time (10 / 20 / 30 / 60 min or custom). Words are spoken automatically; Pause and one Replay per word are available. The screen stays awake during a session.
- **Word Lists**: every session is saved with date/time, duration, category, difficulty and the complete list of words spoken. Search, category filters, per-word Correct / Retest marks, and "Retest marked words".
- **Adaptive learning**: uses your history to pick words: the least practised category, a mix of difficulty levels, and a share of older words you have not heard recently, without immediate repeats.
- **Offline fallback**: without an API key (or when Gemini fails) a built-in word bank is used and a notice explains why.
- **Voice**: British / American / Australian accent, a choice of installed voices, and speech speed.
- **Settings**: Gemini key (paste, test, save, remove; kept in the device's secure storage), defaults, and data management.
- **History management**: delete today / last 7 / 30 / 90 days, delete all history, or clear all app data (with confirmation).

## Setup

```bash
npm install
npx expo start
```

Open it in Expo Go, or build a development client (`npx expo run:android` / `npx expo run:ios`). Then open **Settings**, paste a Gemini key (https://aistudio.google.com/app/apikey) and press **Verify & Save**.

Text-to-speech uses the voices installed on the device. If no voice exists for an accent, the app tells you and uses the default voice.

## Project structure

```
app/
  _layout.tsx            database gate, theme, stack
  (tabs)/                Practice (index), Word Lists (history), Settings
  session/[id].tsx       saved word list, marks, retest
db/                      Drizzle schema, migrations, queries (sessions, history, settings)
lib/
  sessionRunner.ts       interval loop: speak, save, pause, replay, timer
  wordPicker.ts          adaptive selection, repeat avoidance, offline fallback
  gemini.ts              word generation and key test
  tts.ts                 accents and voices
components/              Card, Chip, PrimaryButton, Segmented, VoicePicker, ...
constants/theme.ts       "IELTS Academic Focus" palette (light and dark)
assets/stitch_ielts_spelling_practice_app/   design reference
```

## Database

SQLite file `spelling.db` with three tables: `sessions`, `session_words` and `settings`. After changing `db/schema.ts`, generate a migration and register it in `db/migrations/migrations.js`:

```bash
npx drizzle-kit generate --name <description>
```

## Checks

```bash
npx tsc --noEmit
npx eslint .
npx expo-doctor
```
