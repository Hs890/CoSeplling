# IELTS Listening Spelling Practice

A mobile app for practicing IELTS listening spelling with AI-generated words, offline-first storage, and progress tracking.

## Features

- **Practice Sessions**: Select duration, category, and difficulty level
- **AI Word Generation**: OpenRouter API integration for dynamic word selection
- **Text-to-Speech**: Hear pronunciations (native TTS via `expo-speech`)
- **Mistake Tracking**: Automatic tracking of misspelled words with statistics
- **Offline Support**: Works without internet after initial setup; falls back to stored words
- **Dashboard**: Real-time statistics (accuracy, sessions, practice time, words to review)
- **Settings**: Configure API key, speech rate, default preferences, and data management

## Stack

- **Framework**: Expo 54 + React Native 0.81 + React 19
- **Database**: Expo SQLite + Drizzle ORM
- **AI**: OpenRouter API (configurable model)
- **TTS**: expo-speech
- **Secure Storage**: expo-secure-store
- **Navigation**: expo-router 6 (tab-based)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Create a `.env.local` file (optional, for local testing):
```
# Not needed for app — API key is saved in-app via Settings tab
```

### 3. Run on Android

```bash
npx expo run:android
```

Or use Expo Go:
```bash
npx expo start
```

Then scan QR code with Expo Go or press `a` for Android.

### 4. Configure OpenRouter API Key

1. Get an API key from [OpenRouter](https://openrouter.ai)
2. Open the app → **Settings tab**
3. Paste your API key and tap **Save & Test**
4. Key is stored securely on device (native: `expo-secure-store`, web: fallback to settings table)

## Navigation

**Bottom Tab Navigation:**
- **Dashboard**: Session stats, accuracy, words to review, total practice time
- **Practice**: Set up and run a spelling practice session
- **Mistakes**: Search, filter, and review previously misspelled words
- **Settings**: API key, speech rate, default preferences, data management

## Database Schema

- **words**: Vocabulary with category and difficulty
- **sessions**: Practice sessions (duration, accuracy, attempts)
- **attempts**: Individual word attempts (typed spelling, correctness)
- **mistakes**: Tracked misspellings with wrong/correct counts and history
- **settings**: User preferences (API key fallback, model, speech rate, etc.)

## Practice Workflow

1. **Setup**: Choose duration (5/10/15/20/30 min or custom), category, difficulty
2. **Session**: Listen to word via TTS → Type spelling → Submit
3. **Feedback**: See if correct/incorrect + reveal correct spelling
4. **Results**: View accuracy, session stats, list of missed words
5. **Mistakes**: System auto-tracks wrong answers; practice mistakes separately

### Adaptive Mode

- **Category**: Mix words from your mistakes (most wrong first)
- **Difficulty**: Auto-scales based on overall accuracy

## Offline Support

If no internet or API key not set:
- App still runs using stored words + previously tracked mistakes
- Small notice shown during session
- No new word generation from OpenRouter

## Data Management

**Delete options in Settings:**
- Delete today's history
- Delete last 7 / 30 / 90 days
- Clear practice attempts, sessions, or mistakes separately
- **Clear All Data**: Full reset (requires confirmation)

## Development

### TypeScript & Linting

```bash
npx tsc --noEmit
npm run lint
```

### Build Migration (if schema changes)

```bash
npx drizzle-kit generate --name <description>
```

## Performance Notes

- **SQLite**: Local queries are instant; limit result sets with `limit()` for large data
- **TTS**: Non-blocking; speech is queued; use `Speech.stop()` to interrupt
- **API Calls**: Word generation is cached per session to minimize OpenRouter usage
- **Theme**: Automatic light/dark mode support via system preference

## Future Enhancements

- Export/import session data
- Leaderboard (local)
- Custom category upload (CSV)
- Multi-language support
- Streaks & achievements

## License

MIT

---

**Listen → Type → Check → Save → Learn → Repeat**
