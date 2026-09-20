export const CATEGORIES = [
  'Everyday English',
  'IELTS Listening',
  'Education',
  'Accommodation',
  'Transport',
  'Work',
  'Places',
  'Names',
  'Custom',
  'Adaptive',
] as const;

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Adaptive'] as const;

export const DURATIONS = [5, 10, 15, 20, 30] as const; // minutes

export const DEFAULT_SPEECH_RATE = 1.0;
export const MIN_SPEECH_RATE = 0.5;
export const MAX_SPEECH_RATE = 1.2;

export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
