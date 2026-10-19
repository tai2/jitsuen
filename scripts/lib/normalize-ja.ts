const FULLWIDTH_PUNCT: Record<string, string> = {
  ',': '、',
  '.': '。',
  '!': '！',
  '?': '？',
  ':': '：',
  ';': '、',
  '(': '（',
  ')': '）',
  '"': '',
  "'": '',
  '~': '〜',
  '-': 'ー',
};

/**
 * Strip emoji, pictographs, variation selectors, ZWJ and arrows. These reach the phoneme
 * analyzer as unknown phonemes, which it raises as unregistered exceptions — i.e. an HTTP
 * 500 with a traceback rather than a 4xx.
 */
// Splitting grapheme clusters is the intent here: ZWJ (200D) and the variation selectors
// (FE00-FE0F) are stripped as individual code points so no fragment of an emoji sequence
// survives into the phoneme analyzer. That is exactly what the rule below warns about.
// eslint-disable-next-line no-misleading-character-class
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu;

export const normalizeNarration = (raw: string): string => {
  let s = raw.normalize('NFKC').replace(EMOJI, '');
  s = s.replace(/[,.!?:;()"'~-]/g, (c) => FULLWIDTH_PUNCT[c] ?? '');
  s = s.replace(/\s+/g, ' ').trim();
  // A line stripped to nothing would still synthesize, as silence. Fail instead, so the
  // bad input is loud rather than a silently empty beat.
  if (s.length === 0) throw new Error(`narration normalized to empty: ${JSON.stringify(raw)}`);
  return s;
};
