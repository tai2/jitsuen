import {spawn} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {StoryboardSchema} from './lib/storyboard-schema.ts';
import {getSpeakerInfo, getSpeakers} from './lib/voicevox.ts';

type NarrationManifest = {engine: {version: string; coreVersions: string[]}};

const credits = async (styleId: number) => {
  // Each character has its own policy.md governing credit, commercial use and prohibited
  // content, and they differ per character. Archiving it next to the output is the minimum
  // viable compliance; the credit line still has to appear in whatever gets published.
  try {
    const speakers = await getSpeakers();
    const speaker = speakers.find((s) => s.styles.some((st) => st.id === styleId));
    const info = speaker ? await getSpeakerInfo(speaker.speaker_uuid) : null;
    return {
      name: speaker?.name ?? 'unknown',
      policy: info?.policy ?? '(engine returned no policy for this character)',
    };
  } catch (err) {
    return {
      name: 'unknown',
      policy:
        `(could not fetch — the engine was not reachable: ${(err as Error).message})\n\n` +
        `Start it with \`pnpm engine\` and re-run \`pnpm render\` to capture the real terms. ` +
        `Do not publish without them.`,
    };
  }
};

const run = (command: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: 'inherit'});
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)),
    );
  });

const main = async () => {
  const sb = StoryboardSchema.parse(JSON.parse(await readFile('video/storyboard.json', 'utf8')));
  const narration = JSON.parse(
    await readFile('video/narration.json', 'utf8'),
  ) as NarrationManifest;

  await mkdir('out', {recursive: true});

  /*
   * The CLI is spawned rather than the producer being imported, for two reasons.
   *
   * One: @hyperframes/producer pulls full puppeteer and downloads a second Chromium at
   * install time. The CLI reaches the same renderer through the browser it already
   * manages, and puppeteer-core — which downloads nothing — is all that ends up in the
   * dependency tree.
   *
   * Two: `pnpm render` and `pnpm studio` now go through one code path. The Remotion build
   * had a real divergence here — remotion.config.ts did not apply to the Node APIs, so
   * Studio ran rspack while the render ran webpack, and setDefaultPremountInSeconds could
   * not be expressed on renderMedia() at all. Neither trap exists on this side; every
   * option below is a flag, and the flags are the whole configuration.
   */
  await run('hyperframes', [
    'render',
    '.',
    '--output',
    `out/${sb.project}.mp4`,
    '--format',
    'mp4',
    '--fps',
    String(sb.fps),
    '--crf',
    '18',
    // Source-video frames are extracted as PNG rather than JPEG. Every clip here is a
    // phone screen recording — fine UI text and flat colour, which is exactly what JPEG
    // extraction smears.
    '--video-frame-format',
    'png',
    // One worker: each is a separate Chrome process, and a single one keeps the output
    // reproducible run to run.
    '--workers',
    '1',
    // Fail on a lint error rather than rendering something known to be wrong.
    '--strict',
  ]);

  const {name, policy} = await credits(sb.voice.styleId);
  await writeFile(
    `out/${sb.project}.credits.md`,
    [
      `# ${sb.project} — credits & terms`,
      '',
      `- Narration: VOICEVOX / **${name}** (styleId ${sb.voice.styleId})`,
      `- Engine: ${narration.engine.version}, core: ${narration.engine.coreVersions.join(', ')}`,
      '',
      '## Character terms (policy.md as served by /speaker_info)',
      '',
      policy,
    ].join('\n') + '\n',
  );
  console.log(`→ out/${sb.project}.mp4`);
  console.log(`→ out/${sb.project}.credits.md  (honour these terms when publishing)`);
};

await main();
