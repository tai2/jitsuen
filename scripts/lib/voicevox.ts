export type Mora = {
  text: string;
  consonant: string | null;
  consonant_length: number | null;
  vowel: string;
  vowel_length: number;
  pitch: number;
};

export type AccentPhrase = {
  moras: Mora[];
  accent: number;
  pause_mora: Mora | null;
  is_interrogative: boolean;
};

export type AudioQuery = {
  accent_phrases: AccentPhrase[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  pauseLength: number | null;
  pauseLengthScale: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana?: string;
};

const BASE = process.env.VOICEVOX_URL ?? 'http://127.0.0.1:50021';

const req = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    // A 500 from the phoneme analyzer means "fix the script", not "retry".
    throw new Error(`VOICEVOX ${res.status} ${path}\n${body}`);
  }
  return res;
};

export const getVersion = async () => (await req('/version')).json() as Promise<string>;

export const getCoreVersions = async () =>
  (await req('/core_versions')).json() as Promise<string[]>;

export const initializeSpeaker = async (styleId: number) => {
  await req(`/initialize_speaker?speaker=${styleId}&skip_reinit=true`, {method: 'POST'});
};

/** NB: the query param is `speaker` but the value is a style id, not a speaker id. */
export const audioQuery = async (opts: {
  text: string;
  styleId: number;
  enableKatakanaEnglish?: boolean;
}): Promise<AudioQuery> => {
  const p = new URLSearchParams({
    text: opts.text,
    speaker: String(opts.styleId),
    enable_katakana_english: String(opts.enableKatakanaEnglish ?? true),
  });
  return (await req(`/audio_query?${p}`, {method: 'POST'})).json();
};

export const synthesis = async (opts: {
  query: AudioQuery;
  styleId: number;
  enableInterrogativeUpspeak?: boolean;
}): Promise<Buffer> => {
  const p = new URLSearchParams({
    speaker: String(opts.styleId),
    enable_interrogative_upspeak: String(opts.enableInterrogativeUpspeak ?? true),
  });
  const res = await req(`/synthesis?${p}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(opts.query),
  });
  return Buffer.from(await res.arrayBuffer());
};

export type SpeakerStyle = {id: number; name: string; type?: string};
export type Speaker = {name: string; speaker_uuid: string; styles: SpeakerStyle[]};

export const getSpeakers = async () => (await req('/speakers')).json() as Promise<Speaker[]>;

/** Needed for G7 — archive each character's policy next to the render. */
export const getSpeakerInfo = async (uuid: string) =>
  (await req(`/speaker_info?speaker_uuid=${uuid}&resource_format=url`)).json() as Promise<{
    policy: string;
  }>;

export const addUserDictWord = async (opts: {
  surface: string;
  pronunciation: string;
  accentType: number;
}) => {
  const p = new URLSearchParams({
    surface: opts.surface,
    pronunciation: opts.pronunciation,
    accent_type: String(opts.accentType),
  });
  return (await req(`/user_dict_word?${p}`, {method: 'POST'})).json() as Promise<string>;
};

export const tuneQuery = (
  q: AudioQuery,
  opts: {speed: number; sampleRate: number},
): AudioQuery => ({
  ...q,
  speedScale: opts.speed,
  // Kill the built-in 0.1 s + 0.1 s padding so cuts are tight; padding is added back in
  // Remotion, where it is frame-exact rather than divided by speedScale.
  prePhonemeLength: 0,
  postPhonemeLength: 0,
  // 24 kHz is the engine default and some players reject it; let the engine's soxr
  // resample once, server-side, rather than adding a second resampler at mux time.
  outputSamplingRate: opts.sampleRate,
  outputStereo: false,
});
