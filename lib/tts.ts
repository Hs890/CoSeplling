import * as Speech from 'expo-speech';

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  enhanced: boolean;
}

const norm = (language: string) => language.toLowerCase().replace('_', '-');

let voiceCache: Speech.Voice[] | null = null;

/**
 * Voices installed on the device. Empty results are never cached because Android
 * loads its voice list lazily and the first call can come back empty.
 */
export async function loadVoices(force = false): Promise<Speech.Voice[]> {
  if (voiceCache && voiceCache.length > 0 && !force) return voiceCache;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    voiceCache = voices;
    return voices;
  } catch (e) {
    console.warn('Could not load voices:', e);
    return [];
  }
}

/** Installed voices for an accent (e.g. "en-GB"), best quality first. */
export async function getVoicesForAccent(accent: string, force = false): Promise<VoiceOption[]> {
  const voices = await loadVoices(force);
  return voices
    .filter((v) => norm(v.language) === norm(accent))
    .map((v) => ({
      id: v.identifier,
      name: v.name || v.identifier,
      language: v.language,
      enhanced: v.quality === Speech.VoiceQuality.Enhanced,
    }))
    .sort((a, b) => Number(b.enhanced) - Number(a.enhanced) || a.name.localeCompare(b.name));
}

export interface ResolvedVoice {
  /** Voice identifier to pass to the speech engine; undefined = engine default for the language. */
  id?: string;
  /** True when nothing matched the requested accent/voice and the default is used. */
  usingDefault: boolean;
}

/** The chosen voice if still installed, otherwise the best voice for the accent, otherwise the default. */
export async function resolveVoice(accent: string, voiceId?: string): Promise<ResolvedVoice> {
  const options = await getVoicesForAccent(accent);
  if (voiceId && options.some((o) => o.id === voiceId)) return { id: voiceId, usingDefault: false };
  if (options.length > 0) return { id: options[0].id, usingDefault: false };
  return { usingDefault: true };
}

export async function speakWord(
  word: string,
  rate: number = 1.0,
  accent: string = 'en-GB',
  voiceId?: string,
  onDone?: () => void
): Promise<void> {
  try {
    await Speech.stop();
    const voice = await resolveVoice(accent, voiceId);
    Speech.speak(word, {
      language: accent,
      voice: voice.id,
      rate: Math.max(0.5, Math.min(1.5, rate)),
      onDone,
      onError: (e) => console.warn('TTS error:', e),
    });
  } catch (error) {
    console.warn('TTS speak error:', error);
  }
}

/** Speaks a sample sentence with the given accent, voice and speed; returns whether a matching voice was used. */
export async function speakSample(
  accent: string = 'en-GB',
  rate: number = 1.0,
  voiceId?: string
): Promise<ResolvedVoice> {
  const voice = await resolveVoice(accent, voiceId);
  await speakWord('Please write down the word: accommodation.', rate, accent, voiceId);
  return voice;
}

export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.warn('TTS stop error:', error);
  }
}
