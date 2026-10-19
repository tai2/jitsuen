import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {ensureBrowser, renderMedia, selectComposition} from '@remotion/renderer';
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

const main = async () => {
  const sb = StoryboardSchema.parse(JSON.parse(await readFile('video/storyboard.json', 'utf8')));
  const narration = JSON.parse(
    await readFile('video/narration.json', 'utf8'),
  ) as NarrationManifest;

  await mkdir('out', {recursive: true});
  await ensureBrowser();

  const serveUrl = await bundle({entryPoint: 'src/index.ts'});
  const inputProps = {scenes: sb.scenes};

  // inputProps must go to BOTH calls, or calculateMetadata resolves against the wrong props
  // and the duration silently differs from what gets rendered.
  const composition = await selectComposition({serveUrl, id: 'DemoVideo', inputProps});

  const {slowestFrames} = await renderMedia({
    composition,
    serveUrl,
    inputProps,
    codec: 'h264',
    outputLocation: `out/${sb.project}.mp4`,
    // remotion.config.ts does NOT apply to the Node APIs — every option is explicit here.
    overwrite: true,
    imageFormat: 'jpeg',
    jpegQuality: 90,
    crf: 18,
    audioCodec: 'aac',
    sampleRate: 48000,
    enforceAudioTrack: true,
    timeoutInMilliseconds: 60000,
    onProgress: ({progress}) => process.stdout.write(`\r${(progress * 100).toFixed(1)}%`),
  });
  console.log('\nslowest frames:', slowestFrames?.slice(0, 5));

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
