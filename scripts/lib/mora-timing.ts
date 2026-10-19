import type {AccentPhrase, AudioQuery, Mora} from './voicevox.ts';

export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
  pageBreakAfter?: boolean;
};

/** Unvoiced vowels + silence markers — upspeak is only appended after a *voiced* final mora. */
const UNVOICED = new Set(['A', 'I', 'U', 'E', 'O', 'cl', 'pau', 'sil']);

const moraSeconds = (m: Mora, speed: number) =>
  ((m.consonant_length ?? 0) + m.vowel_length) / speed;

export type MoraTiming = {text: string; startMs: number; endMs: number};

/**
 * Reconstruct per-mora timings from the AudioQuery actually POSTed to /synthesis.
 * Accurate to the engine's 1/93.75 s ~= 10.667 ms quantum; the per-phoneme
 * round-half-to-even is deliberately not replicated, because the authoritative clip
 * length comes from measuring the WAV. Captions at +/-11 ms are sub-frame at 30 fps.
 */
export const moraTimings = (
  q: AudioQuery,
  opts: {enableInterrogativeUpspeak: boolean},
): MoraTiming[] => {
  const speed = q.speedScale;
  const out: MoraTiming[] = [];
  // prePhonemeLength is inserted before the speed scale is applied, so it divides too.
  let t = q.prePhonemeLength / speed;

  for (const phrase of q.accent_phrases) {
    for (const m of phrase.moras) {
      const d = moraSeconds(m, speed);
      out.push({text: m.text, startMs: t * 1000, endMs: (t + d) * 1000});
      t += d;
    }

    // Interrogative upspeak appends a 0.15 s duplicate-vowel mora that is NOT present in
    // the query you sent, and it too is inserted before the speed scale.
    //
    // That extra mora has no entry of its own in `out`, so its time is folded into the
    // final mora it duplicates. Without this the audio of a trailing question outlasts
    // the last caption by 0.15 s, and `out.at(-1).endMs` understates the clip length by
    // the same amount — measured at 137 ms of drift on a real line before this fix.
    const last = phrase.moras.at(-1);
    if (
      opts.enableInterrogativeUpspeak &&
      phrase.is_interrogative &&
      last &&
      !UNVOICED.has(last.vowel)
    ) {
      const upspeak = 0.15 / speed;
      t += upspeak;
      const tail = out.at(-1);
      if (tail) tail.endMs = t * 1000;
    }

    if (phrase.pause_mora) {
      // pauseLength overrides the pause mora's own length, then pauseLengthScale scales it.
      const base = q.pauseLength ?? phrase.pause_mora.vowel_length;
      t += (base * q.pauseLengthScale) / speed;
    }
  }
  return out;
};

/**
 * Split narration into the clauses VOICEVOX itself breathes at. The engine emits a
 * `pause_mora` on the accent phrase that precedes a 、 or 。, so an accent-phrase run
 * ending in a pause is exactly one spoken clause.
 */
const breathGroups = (q: AudioQuery): AccentPhrase[][] => {
  const groups: AccentPhrase[][] = [];
  let current: AccentPhrase[] = [];
  for (const phrase of q.accent_phrases) {
    current.push(phrase);
    if (phrase.pause_mora) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
};

/**
 * Split the authored text wherever the engine takes a breath, keeping the delimiter
 * attached. That means punctuation AND whitespace: a space between a product name and the
 * following particle makes VOICEVOX emit a pause there just as 、 does, so splitting on
 * punctuation alone leaves fewer clauses than there are breath groups.
 */
const sourceClauses = (text: string): string[] =>
  text
    .split(/(?<=[、。！？])/u)
    .flatMap((s) => s.split(/\s+/u))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

/**
 * Captions, one per spoken clause.
 *
 * `text` comes from the AUTHORED narration, not from the moras. Mora text is phonetic —
 * 製品 is emitted as セエヒン and ツール as ツウル — so using it on screen would show the
 * viewer broken Japanese. Timing still comes from the mora walk, which is what the moras
 * are actually good for.
 *
 * When the clause count and the breath-group count disagree the alignment is not
 * trustworthy, so this degrades to the phonetic text rather than mislabelling audio.
 * Japanese has no inter-word spaces, so `text` carries no leading space.
 */
export const toCaptions = (
  q: AudioQuery,
  opts: {enableInterrogativeUpspeak: boolean; sourceText?: string},
): Caption[] => {
  const timings = moraTimings(q, opts);
  const groups = breathGroups(q);
  const clauses = opts.sourceText ? sourceClauses(opts.sourceText) : [];
  const aligned = clauses.length === groups.length;

  const captions: Caption[] = [];
  let i = 0;

  for (const [g, group] of groups.entries()) {
    const moraCount = group.reduce((n, phrase) => n + phrase.moras.length, 0);
    const chunk = timings.slice(i, i + moraCount);
    i += moraCount;
    if (chunk.length === 0) continue;

    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    if (!first || !last) continue;

    const phonetic = chunk.map((c) => c.text).join('');
    captions.push({
      text: aligned ? (clauses[g] ?? phonetic) : phonetic,
      startMs: Math.round(first.startMs),
      endMs: Math.round(last.endMs),
      timestampMs: Math.round((first.startMs + last.endMs) / 2),
      confidence: null,
      pageBreakAfter: true,
    });
  }
  return captions;
};

/** Vowel each katakana row ends in, used to expand ー into the vowel the engine emits. */
const VOWEL_OF: Record<string, string> = {
  ア: 'ア', カ: 'ア', サ: 'ア', タ: 'ア', ナ: 'ア', ハ: 'ア', マ: 'ア', ヤ: 'ア',
  ラ: 'ア', ワ: 'ア', ガ: 'ア', ザ: 'ア', ダ: 'ア', バ: 'ア', パ: 'ア', ャ: 'ア',
  イ: 'イ', キ: 'イ', シ: 'イ', チ: 'イ', ニ: 'イ', ヒ: 'イ', ミ: 'イ', リ: 'イ',
  ギ: 'イ', ジ: 'イ', ヂ: 'イ', ビ: 'イ', ピ: 'イ',
  ウ: 'ウ', ク: 'ウ', ス: 'ウ', ツ: 'ウ', ヌ: 'ウ', フ: 'ウ', ム: 'ウ', ユ: 'ウ',
  ル: 'ウ', グ: 'ウ', ズ: 'ウ', ヅ: 'ウ', ブ: 'ウ', プ: 'ウ', ュ: 'ウ',
  エ: 'エ', ケ: 'エ', セ: 'エ', テ: 'エ', ネ: 'エ', ヘ: 'エ', メ: 'エ', レ: 'エ',
  ゲ: 'エ', ゼ: 'エ', デ: 'エ', ベ: 'エ', ペ: 'エ',
  オ: 'オ', コ: 'オ', ソ: 'オ', ト: 'オ', ノ: 'オ', ホ: 'オ', モ: 'オ', ヨ: 'オ',
  ロ: 'オ', ゴ: 'オ', ゾ: 'オ', ド: 'オ', ボ: 'オ', ポ: 'オ', ョ: 'オ',
};

/**
 * Rewrite ー as the vowel the engine actually emits, so a needle written the way a human
 * spells it still matches. The mora stream is phonetic: ダッシュボード is emitted as
 * ダッシュボオド, so a literal ダッシュボード never matches.
 */
const expandLongVowels = (s: string): string => {
  let out = '';
  for (const ch of s) {
    if (ch === 'ー' || ch === '―' || ch === '‐') {
      const prev = out.at(-1);
      out += (prev && VOWEL_OF[prev]) || '';
    } else {
      out += ch;
    }
  }
  return out;
};

/** The phonetic mora stream, for error messages and for matching cues against. */
export const moraText = (timings: MoraTiming[]): string =>
  timings.map((t) => t.text).join('');

/**
 * Visual cues: "highlight the Save button exactly when the word is spoken."
 * Finds the first mora run matching a kana needle and returns its frame. Needles that do
 * not occur are omitted, so the caller can report them.
 */
export const cueFrames = (
  timings: MoraTiming[],
  needles: string[],
  fps: number,
): Record<string, number> => {
  const joined = moraText(timings);
  const cues: Record<string, number> = {};
  for (const needle of needles) {
    let at = joined.indexOf(needle);
    if (at < 0) at = joined.indexOf(expandLongVowels(needle));
    if (at < 0) continue;
    let consumed = 0;
    for (const t of timings) {
      if (consumed >= at) {
        cues[needle] = Math.round((t.startMs / 1000) * fps);
        break;
      }
      consumed += t.text.length;
    }
  }
  return cues;
};
