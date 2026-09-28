export interface HintPart {
  text: string;
  /** Letters to highlight in red (the tricky part of the word). */
  highlight?: boolean;
}

export interface SpellingHint {
  icon: 'flag' | 'info';
  parts: HintPart[];
}

/**
 * A short spelling reminder worked out from the word itself (double letters, silent letters,
 * confusing patterns, long words). Returns null when nothing notable applies.
 */
export function spellingHint(rawWord: string): SpellingHint | null {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length < 4) return null;

  const doubles = Array.from(new Set(word.match(/([a-z])\1/g) ?? []));
  if (doubles.length > 0) {
    const parts: HintPart[] = [{ text: 'Common trap: ' }];
    doubles.forEach((d, i) => {
      if (i === 0) parts.push({ text: 'contains double ' });
      else parts.push({ text: i === doubles.length - 1 ? ' and double ' : ', double ' });
      parts.push({ text: d, highlight: true });
    });
    parts.push({ text: '.' });
    return { icon: 'flag', parts };
  }

  if (/^kn|^wr|^gn|^ps/.test(word)) {
    return {
      icon: 'flag',
      parts: [{ text: 'Silent first letter: ' }, { text: word.slice(0, 1), highlight: true }, { text: '.' }],
    };
  }
  if (/mb$/.test(word)) {
    return { icon: 'flag', parts: [{ text: 'Silent ' }, { text: 'b', highlight: true }, { text: ' after m at the end.' }] };
  }
  if (/ough|augh|igh/.test(word)) {
    return { icon: 'flag', parts: [{ text: 'Watch the silent ' }, { text: 'gh', highlight: true }, { text: ' spelling.' }] };
  }
  const ie = word.match(/ie|ei/);
  if (ie) {
    return {
      icon: 'info',
      parts: [{ text: 'Check the order of ' }, { text: ie[0], highlight: true }, { text: ' ("i before e, except after c").' }],
    };
  }
  if (word.length >= 10) {
    return { icon: 'info', parts: [{ text: 'Long word: split it into syllables before writing it.' }] };
  }
  return null;
}
