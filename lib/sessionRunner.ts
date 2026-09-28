import { fetchWordBatch, resolveTargets, type SessionTargets } from './wordPicker';
import { finalizeSession, recordSpokenWord, updateSessionLabel } from '../db/queries/sessions';
import { speakWord, stopSpeech } from './tts';

const BATCH_SIZE = 40;
/** Fetch the next batch in the background when this few words are left. */
const REFILL_AT = 8;
const TICK_MS = 100;

const now = () => Date.now();
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface CancelToken {
  cancelRequested: boolean;
  paused: boolean;
  replayRequested: boolean;
}

export interface SessionConfig {
  sessionId: number;
  durationSec: number;
  intervalSec: number;
  category: string;
  difficulty: string;
  customCategoryText?: string;
  accent: string;
  voiceId?: string;
  speechRate: number;
  apiKey?: string;
  model?: string;
  /** Fixed list for Retest mode (no AI, no refills). */
  words?: string[];
}

export interface RunCallbacks {
  onTick: (remainingSec: number, nextWordInSec: number, elapsedActiveSec: number) => void;
  /** Deliberately receives only the position, never the word itself. */
  onWordSpoken: (position: number, totalSpoken: number) => void;
  onReplaysLeft: (left: number) => void;
  /** Non-fatal information (AI unavailable, repeats used, ended early). */
  onNotice?: (message: string) => void;
  onFinished: (result: {
    totalWords: number;
    durationActualSec: number;
    cancelled: boolean;
    error?: string;
  }) => void;
}

/**
 * Runs one listening session: speaks a word every `intervalSec` seconds of *active* time
 * (pausing freezes the clock) until `durationSec` is used up or the token is cancelled.
 * Each word is saved to the database as it is spoken. Never throws; failures are reported
 * through `onFinished`.
 */
export async function runSession(
  config: SessionConfig,
  token: CancelToken,
  callbacks: RunCallbacks
): Promise<void> {
  const { sessionId, durationSec, intervalSec, accent, voiceId, speechRate, apiKey, model } = config;
  const fixedWords = config.words;

  const queue: string[] = fixedWords ? [...fixedWords] : [];
  const used = new Set<string>(queue.map((w) => w.toLowerCase())); // spoken or queued
  const noticed = new Set<string>();
  let targets: SessionTargets | null = null;
  let refilling: Promise<void> | null = null;
  let exhausted = Boolean(fixedWords);

  let position = 0;
  let currentWord: string | null = null;
  let replaysLeft = 1;
  let elapsedActiveSec = 0;
  let error: string | undefined;

  const notify = (message?: string) => {
    if (message && !noticed.has(message)) {
      noticed.add(message);
      callbacks.onNotice?.(message);
    }
  };

  // One refill at a time; exclude everything already spoken or queued
  const refill = (count: number): Promise<void> => {
    if (refilling || exhausted || !targets) return refilling ?? Promise.resolve();
    const t = targets;
    refilling = (async () => {
      try {
        const batch = await fetchWordBatch({
          targets: t,
          apiKey,
          model,
          usedWords: Array.from(used),
          count,
        });
        notify(batch.notice);
        let added = 0;
        for (const w of batch.words) {
          const key = w.toLowerCase();
          if (used.has(key)) continue;
          used.add(key);
          queue.push(w);
          added += 1;
        }
        if (added === 0) exhausted = true;
      } catch (e) {
        console.warn('Word batch failed:', e);
        exhausted = true;
      } finally {
        refilling = null;
      }
    })();
    return refilling;
  };

  try {
    if (!fixedWords) {
      targets = await resolveTargets(config.category, config.difficulty, config.customCategoryText);
      await updateSessionLabel(sessionId, targets.label, config.difficulty);
      const needed = Math.ceil(durationSec / intervalSec) + 2;
      await refill(Math.min(BATCH_SIZE, Math.max(10, needed)));
    }

    callbacks.onReplaysLeft(1);

    let timeToNextWord = 0; // first word is spoken immediately
    let lastTimestamp = now();
    let wasPaused = false;

    while (elapsedActiveSec < durationSec && !token.cancelRequested) {
      const t = now();
      const dt = (t - lastTimestamp) / 1000;
      lastTimestamp = t;

      if (token.paused) {
        if (!wasPaused) {
          wasPaused = true;
          await stopSpeech();
        }
        await delay(TICK_MS);
        continue;
      }
      wasPaused = false;

      elapsedActiveSec += dt;
      timeToNextWord -= dt;

      if (token.replayRequested && currentWord && replaysLeft > 0) {
        token.replayRequested = false;
        replaysLeft -= 1;
        callbacks.onReplaysLeft(replaysLeft);
        void speakWord(currentWord, speechRate, accent, voiceId);
      } else {
        token.replayRequested = false;
      }

      if (timeToNextWord <= 0) {
        if (!fixedWords && queue.length <= REFILL_AT) void refill(BATCH_SIZE);
        if (queue.length === 0 && refilling) await refilling;

        const next = queue.shift();
        if (!next) {
          notify(
            fixedWords
              ? undefined
              : 'No more words are available, so the session ended early.'
          );
          break;
        }

        currentWord = next;
        position += 1;
        replaysLeft = 1;
        callbacks.onReplaysLeft(1);
        await recordSpokenWord(sessionId, position, next);
        callbacks.onWordSpoken(position, position);
        void speakWord(next, speechRate, accent, voiceId);
        timeToNextWord = intervalSec;
      }

      callbacks.onTick(
        Math.max(0, durationSec - elapsedActiveSec),
        Math.max(0, timeToNextWord),
        elapsedActiveSec
      );
      await delay(TICK_MS);
    }
  } catch (e) {
    console.warn('Session failed:', e);
    error = 'The session stopped because of an unexpected error. Words spoken so far were saved.';
  } finally {
    await stopSpeech();
    const durationActualSec = Math.max(1, Math.round(elapsedActiveSec));
    try {
      await finalizeSession(sessionId, durationActualSec);
    } catch (e) {
      console.warn('Could not finalize session:', e);
    }
    callbacks.onFinished({
      totalWords: position,
      durationActualSec,
      cancelled: token.cancelRequested,
      error,
    });
  }
}
