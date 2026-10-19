import {createHash} from 'node:crypto';
import {access, copyFile, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ALL_FORMATS, FilePathSource, Input} from 'mediabunny';
import type {Caption} from './lib/mora-timing.ts';
import {cueFrames, moraText, moraTimings, toCaptions} from './lib/mora-timing.ts';
import {normalizeNarration} from './lib/normalize-ja.ts';
import {StoryboardSchema} from './lib/storyboard-schema.ts';
import type {AudioQuery} from './lib/voicevox.ts';
import {
  audioQuery,
  getCoreVersions,
  getVersion,
  initializeSpeaker,
  synthesis,
  tuneQuery,
} from './lib/voicevox.ts';

const CACHE = '.cache/voicevox';
const UPSPEAK = true;

type NarrationScene = {
  wav: string | null;
  text: string | null;
  durationSec: number;
  captions: Caption[];
  cues: Record<string, number>;
};

const exists = async (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );

const applyReadings = (text: string, readings: Record<string, string>) =>
  Object.entries(readings).reduce((acc, [surface, kana]) => acc.replaceAll(surface, kana), text);

const measure = async (path: string) => {
  const input = new Input({formats: ALL_FORMATS, source: new FilePathSource(path)});
  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
};

const main = async () => {
  const sb = StoryboardSchema.parse(JSON.parse(await readFile('video/storyboard.json', 'utf8')));
  const engineVersion = await getVersion();
  const coreVersions = await getCoreVersions();

  const outDir = join('assets/voiceover', sb.project);
  // Rebuilt from scratch, mirroring ingest-assets.ts. Without this the directory only ever
  // grows: a renamed or deleted scene leaves its WAV behind, every orphan is served and
  // bundled into the render, and `pnpm voice` quietly stops being a description of the
  // storyboard. The synthesis cache under .cache makes a rebuild nearly free.
  await rm(outDir, {recursive: true, force: true});
  await mkdir(outDir, {recursive: true});
  await mkdir(CACHE, {recursive: true});

  // Pay the model-load cost once, up front, rather than on the first synthesis.
  await initializeSpeaker(sb.voice.styleId);

  const scenes: Record<string, NarrationScene> = {};
  let hits = 0;
  let misses = 0;

  // SEQUENTIAL ON PURPOSE: the core holds one mutex per core, so concurrent /synthesis
  // calls buy almost nothing and only complicate failure handling.
  for (const scene of sb.scenes) {
    if (scene.narration === null) {
      scenes[scene.id] = {wav: null, text: null, durationSec: 0, captions: [], cues: {}};
      console.log(`- ${scene.id}  (silent)`);
      continue;
    }

    const text = normalizeNarration(applyReadings(scene.narration, sb.readings));

    // Cache key includes engine AND core version: a core upgrade changes prosody and
    // therefore every duration.
    const key = createHash('sha256')
      .update(
        JSON.stringify({
          text,
          styleId: sb.voice.styleId,
          speed: sb.voice.speed,
          sampleRate: sb.voice.sampleRate,
          upspeak: UPSPEAK,
          engineVersion,
          coreVersions,
        }),
      )
      .digest('hex');

    const cachedWav = join(CACHE, `${key}.wav`);
    const cachedQuery = join(CACHE, `${key}.query.json`);
    const dest = join(outDir, `${scene.id}.wav`);

    // Read the cache state BEFORE writing, or the log below always reports a hit.
    const cached = await exists(cachedWav);

    let query: AudioQuery;
    if (cached) {
      query = JSON.parse(await readFile(cachedQuery, 'utf8')) as AudioQuery;
      hits++;
    } else {
      const raw = await audioQuery({text, styleId: sb.voice.styleId, enableKatakanaEnglish: true});
      // Engine 0.25.2 does NOT reject text it cannot analyze — it returns zero accent
      // phrases, which synthesizes to near-silence and would collapse this scene to
      // minSeconds with no narration and no error. Fail loudly instead.
      if (raw.accent_phrases.length === 0) {
        throw new Error(
          `scene "${scene.id}": VOICEVOX produced no accent phrases for ${JSON.stringify(text)}. ` +
            `The text has nothing the phoneme analyzer can read — check for stray symbols ` +
            `or a readings entry that replaced the whole line.`,
        );
      }
      query = tuneQuery(raw, {speed: sb.voice.speed, sampleRate: sb.voice.sampleRate});
      const wav = await synthesis({
        query,
        styleId: sb.voice.styleId,
        enableInterrogativeUpspeak: UPSPEAK,
      });
      await writeFile(cachedWav, wav);
      await writeFile(cachedQuery, JSON.stringify(query));
      misses++;
    }

    // public/ is served at a hash-free URL, so bust via the filename, never a query
    // string. The scene id IS the cache-busting name.
    await copyFile(cachedWav, dest);

    // The WAV is authoritative for scene length; the query is authoritative for what
    // happens inside it.
    const durationSec = await measure(dest);
    const timings = moraTimings(query, {enableInterrogativeUpspeak: UPSPEAK});

    const cues = cueFrames(timings, scene.cues, sb.fps);
    const unmatched = scene.cues.filter((c) => !(c in cues));
    if (unmatched.length > 0) {
      // Not fatal — a cue only drives an optional visual accent — but silence here would
      // leave the agent guessing why nothing highlighted.
      console.warn(
        `  ! scene "${scene.id}": no mora match for ${unmatched.map((c) => JSON.stringify(c)).join(', ')}\n` +
          `    spoken moras: ${moraText(timings)}`,
      );
    }

    scenes[scene.id] = {
      // Project-root-relative, no leading slash: the composition resolves it against
      // /index.html, like every other path it loads.
      wav: `assets/voiceover/${sb.project}/${scene.id}.wav`,
      text,
      durationSec,
      captions: toCaptions(query, {enableInterrogativeUpspeak: UPSPEAK, sourceText: text}),
      cues,
    };
    console.log(`${cached ? '·' : '✓'} ${scene.id}  ${durationSec.toFixed(3)}s`);
  }

  await writeFile(
    'video/narration.json',
    JSON.stringify(
      {engine: {version: engineVersion, coreVersions}, project: sb.project, scenes},
      null,
      2,
    ) + '\n',
  );
  console.log(`\n${misses} synthesized, ${hits} cached → video/narration.json`);
};

await main();
