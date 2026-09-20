import { OPENROUTER_API_URL } from './constants';

export interface WordGenerationRequest {
  category: string;
  difficulty: string;
  count?: number;
  exclude?: string[];
  model?: string;
}

export interface WordGenerationResponse {
  words: string[];
  error?: string;
}

const WORD_REGEX = /^[a-z' -]{2,30}$/i;

export async function generateWords(
  apiKey: string,
  request: WordGenerationRequest
): Promise<WordGenerationResponse> {
  const { category, difficulty, count = 15, exclude = [], model = 'openai/gpt-4o-mini' } = request;

  const excludeList = exclude.filter((w) => typeof w === 'string' && w.trim().length > 0);
  const excludeText = excludeList.length > 0 ? `Do NOT include any of these words: ${excludeList.join(', ')}.` : '';

  const prompt = `You are an IELTS exam vocabulary generator.
Generate a list of exactly ${count} English words/terms commonly tested in IELTS Listening for:
Category: "${category}"
Difficulty level: "${difficulty}".

Rules:
1. Each item must be a single word or short compound noun (2-25 characters).
2. ${excludeText}
3. Output MUST be ONLY a JSON array of strings, e.g. ["example", "calendar", "environment"]. Do NOT wrap in markdown codeblocks. Do NOT include explanations.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return { words: [], error: `HTTP ${response.status}: ${errText.slice(0, 100)}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { words: [], error: 'Empty response from model' };
    }

    // Try to parse JSON array from response
    let parsed: any;
    try {
      // Direct parse
      parsed = JSON.parse(content);
    } catch {
      // Find JSON array in text if wrapped
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          parsed = JSON.parse(objMatch[0]);
        }
      }
    }

    let wordList: any[] = [];
    if (Array.isArray(parsed)) {
      wordList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      wordList = parsed.words || parsed.vocabulary || parsed.items || Object.values(parsed);
    }

    if (!Array.isArray(wordList)) {
      return { words: [], error: 'Could not extract word list from model response' };
    }

    const validWords = wordList
      .map((w) => (typeof w === 'string' ? w.trim().toLowerCase() : ''))
      .filter((w) => w && WORD_REGEX.test(w) && !excludeList.map((e) => e.toLowerCase()).includes(w))
      .slice(0, count);

    return { words: validWords };
  } catch (error: any) {
    console.warn('Word generation error:', error?.message || error);
    return { words: [], error: error?.message || String(error) };
  }
}
