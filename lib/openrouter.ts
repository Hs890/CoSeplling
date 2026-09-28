import { DEFAULT_MODEL, OPENROUTER_API_URL } from './constants';

export type OpenRouterErrorCode =
  | 'invalid_key'
  | 'no_credits'
  | 'rate_limited'
  | 'model_unavailable'
  | 'timeout'
  | 'network'
  | 'server'
  | 'bad_response';

const MESSAGES: Record<OpenRouterErrorCode, string> = {
  invalid_key: 'OpenRouter rejected the API key. Check that it was pasted completely.',
  no_credits: 'The OpenRouter account has no credits left for this model.',
  rate_limited: 'OpenRouter is rate limiting requests. Try again in a moment.',
  model_unavailable: 'That model is not available on OpenRouter. Pick another model in Settings.',
  timeout: 'OpenRouter took too long to respond.',
  network: 'Could not reach OpenRouter. Check your internet connection.',
  server: 'OpenRouter had a server problem. Try again shortly.',
  bad_response: 'The model returned an answer the app could not read.',
};

export class OpenRouterError extends Error {
  code: OpenRouterErrorCode;
  status?: number;

  constructor(code: OpenRouterErrorCode, status?: number) {
    super(MESSAGES[code]);
    this.name = 'OpenRouterError';
    this.code = code;
    this.status = status;
  }
}

/** Human-readable message for anything thrown by this module. */
export function describeError(e: unknown): string {
  return e instanceof OpenRouterError ? e.message : 'Unexpected error talking to OpenRouter.';
}

const APP_HEADERS = {
  'HTTP-Referer': 'https://github.com/hafizsaad5678/trigger',
  'X-Title': 'IELTS Spelling Practice',
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface RequestOptions {
  apiKey?: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  timeoutMs?: number;
}

async function request(path: string, opts: RequestOptions): Promise<any> {
  const { apiKey, method = 'GET', body, timeoutMs = 30000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${OPENROUTER_API_URL}${path}`, {
      method,
      headers: {
        ...APP_HEADERS,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(apiKey ? { Authorization: `Bearer ${apiKey.trim()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e: any) {
    throw new OpenRouterError(e?.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const s = response.status;
    if (s === 401 || s === 403) throw new OpenRouterError('invalid_key', s);
    if (s === 402) throw new OpenRouterError('no_credits', s);
    if (s === 404) throw new OpenRouterError('model_unavailable', s);
    if (s === 429) throw new OpenRouterError('rate_limited', s);
    if (s >= 500) throw new OpenRouterError('server', s);
    throw new OpenRouterError('bad_response', s); // 400 etc.; callers may retry differently
  }

  try {
    return await response.json();
  } catch {
    throw new OpenRouterError('bad_response', response.status);
  }
}

// ---------------------------------------------------------------------------
// Key and model checks (used by Settings)
// ---------------------------------------------------------------------------

export interface KeyInfo {
  label?: string;
  /** Remaining credit in USD, or null when the key has no limit. */
  remaining: number | null;
}

/** Validates the key against GET /auth/key. Throws OpenRouterError on failure. */
export async function testApiKey(apiKey: string): Promise<KeyInfo> {
  const json = await request('/auth/key', { apiKey, timeoutMs: 10000 });
  const data = json?.data ?? {};
  const limit = typeof data.limit === 'number' ? data.limit : null;
  const usage = typeof data.usage === 'number' ? data.usage : 0;
  return { label: data.label, remaining: limit === null ? null : Math.max(0, limit - usage) };
}

let modelCache: string[] | null = null;

/** All model ids OpenRouter currently offers (public endpoint), cached per app run. */
export async function fetchModelIds(force = false): Promise<string[]> {
  if (modelCache && !force) return modelCache;
  const json = await request('/models', { timeoutMs: 15000 });
  const ids: string[] = (json?.data ?? [])
    .map((m: any) => m?.id)
    .filter((id: unknown): id is string => typeof id === 'string')
    .sort();
  if (ids.length > 0) modelCache = ids;
  return ids;
}

/** Sends a tiny completion to prove the key + model combination works. */
export async function testModel(apiKey: string, model: string): Promise<void> {
  const json = await request('/chat/completions', {
    apiKey,
    method: 'POST',
    timeoutMs: 30000,
    body: {
      model,
      messages: [{ role: 'user', content: 'Say hello in one word.' }],
      max_tokens: 64,
    },
  });
  if (!json?.choices?.[0]?.message) throw new OpenRouterError('bad_response');
}

// ---------------------------------------------------------------------------
// Word generation
// ---------------------------------------------------------------------------

export interface WordGenerationRequest {
  category: string;
  /** Difficulty wording for the prompt (may describe a mix for adaptive sessions). */
  difficulty: string;
  count?: number;
  exclude?: string[];
  model?: string;
}

export interface WordGenerationResponse {
  words: string[];
  /** Friendly message when the AI could not be used; callers fall back to the offline bank. */
  error?: string;
  errorCode?: OpenRouterErrorCode;
}

const WORD_REGEX = /^[a-z][a-z' -]{1,29}$/i;
const EXCLUDE_IN_PROMPT = 80;

const WORD_LIST_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'word_list',
    strict: true,
    schema: {
      type: 'object',
      properties: { words: { type: 'array', items: { type: 'string' } } },
      required: ['words'],
      additionalProperties: false,
    },
  },
};

function buildPrompt(category: string, difficulty: string, count: number, exclude: string[]): string {
  const excludeLine =
    exclude.length > 0
      ? `Do not use any of these words: ${exclude.slice(0, EXCLUDE_IN_PROMPT).join(', ')}.`
      : '';
  return [
    `You create word lists for IELTS Listening spelling practice.`,
    `Give exactly ${count} different English words or short terms for the category "${category}".`,
    `Difficulty: ${difficulty}.`,
    `Each item must be a single word (letters, apostrophe or hyphen only, 2-30 characters) that a candidate could hear and write down.`,
    excludeLine,
    `Answer with JSON only, in this exact shape: {"words": ["word1", "word2"]}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Accepts {"words":[...]}, a bare array, or JSON wrapped in prose / code fences. */
function parseWordList(content: string): string[] {
  const candidates = [content];
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1]);
  const obj = content.match(/\{[\s\S]*\}/);
  if (obj) candidates.push(obj[0]);
  const arr = content.match(/\[[\s\S]*\]/);
  if (arr) candidates.push(arr[0]);

  for (const text of candidates) {
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed?.words;
      if (Array.isArray(list)) return list.filter((w): w is string => typeof w === 'string');
    } catch {
      // try the next candidate
    }
  }
  throw new OpenRouterError('bad_response');
}

async function completeWithRetry(
  apiKey: string,
  model: string,
  prompt: string,
  useSchema: boolean
): Promise<string> {
  const send = () =>
    request('/chat/completions', {
      apiKey,
      method: 'POST',
      timeoutMs: 30000,
      body: {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        ...(useSchema ? { response_format: WORD_LIST_SCHEMA } : {}),
      },
    });

  let json: any;
  try {
    json = await send();
  } catch (e) {
    // One retry with a short backoff for transient problems
    if (e instanceof OpenRouterError && (e.code === 'rate_limited' || e.code === 'server' || e.code === 'timeout')) {
      await sleep(1500);
      json = await send();
    } else {
      throw e;
    }
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new OpenRouterError('bad_response');
  return content;
}

/**
 * Asks the model for a batch of words. Never throws: on failure returns no words plus a
 * friendly `error`, so the caller can fall back to the built-in bank.
 */
export async function generateWords(
  apiKey: string,
  request: WordGenerationRequest
): Promise<WordGenerationResponse> {
  const { category, difficulty, count = 20, exclude = [], model = DEFAULT_MODEL } = request;
  const prompt = buildPrompt(category, difficulty, count, exclude);

  try {
    let content: string;
    try {
      content = await completeWithRetry(apiKey, model, prompt, true);
    } catch (e) {
      // Some models/providers reject response_format (HTTP 400 -> bad_response): retry as plain text
      if (e instanceof OpenRouterError && e.code === 'bad_response') {
        content = await completeWithRetry(apiKey, model, prompt, false);
      } else {
        throw e;
      }
    }

    const excluded = new Set(exclude.map((w) => w.toLowerCase()));
    const seen = new Set<string>();
    const words: string[] = [];
    for (const raw of parseWordList(content)) {
      const word = raw.trim().toLowerCase();
      if (!WORD_REGEX.test(word) || excluded.has(word) || seen.has(word)) continue;
      seen.add(word);
      words.push(word);
    }
    return { words: words.slice(0, count) };
  } catch (e) {
    const code = e instanceof OpenRouterError ? e.code : undefined;
    console.warn('Word generation failed:', code ?? e);
    return { words: [], error: describeError(e), errorCode: code };
  }
}
