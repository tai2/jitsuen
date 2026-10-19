import {readFile} from 'node:fs/promises';
import type {Asset} from './ingest-assets.ts';
import {StoryboardSchema} from './lib/storyboard-schema.ts';
import {getSpeakers} from './lib/voicevox.ts';

const main = async () => {
  const sb = StoryboardSchema.parse(JSON.parse(await readFile('video/storyboard.json', 'utf8')));


  const {assets} = JSON.parse(await readFile('video/assets.json', 'utf8')) as {
    assets: Record<string, Asset>;
  };
  const errors: string[] = [];

  const ids = new Set<string>();
  for (const scene of sb.scenes) {
    if (ids.has(scene.id)) errors.push(`duplicate scene id: ${scene.id}`);
    ids.add(scene.id);

    if ('asset' in scene) {
      const a = assets[scene.asset];
      if (!a) {
        errors.push(`scene ${scene.id}: asset "${scene.asset}" not in video/assets.json`);
      } else if (scene.type === 'screencast') {
        if (a.kind !== 'video') {
          errors.push(`scene ${scene.id}: screencast asset "${scene.asset}" is not a video`);
        } else {
          if (a.warning) errors.push(`scene ${scene.id}: ${a.warning}`);
          // The footage budget is NOT checked here any more. It used to read
          // `trimBeforeSeconds + minSeconds x playbackRate`, but minSeconds is only a
          // floor: a scene is actually as long as its narration needs, which is not known
          // until `pnpm voice` has run. That made the check optimistic — the splash scene
          // reported ~0.95s of headroom while really having 0.09s. The exact version lives
          // in scripts/check-timing.ts, which runs after voice and has the real durations.
        }
      } else if (scene.type === 'screenshot' && a.kind !== 'image') {
        errors.push(`scene ${scene.id}: screenshot asset "${scene.asset}" is not an image`);
      }
    }
  }

  // styleId must exist on the *running* engine — a 422 mid-batch is worse than a check here.
  const speakers = await getSpeakers();
  const styleIds = new Set(speakers.flatMap((s) => s.styles.map((st) => st.id)));
  if (!styleIds.has(sb.voice.styleId)) {
    errors.push(
      `voice.styleId ${sb.voice.styleId} not found. Available: ` +
        speakers.map((s) => `${s.name}=${s.styles.map((st) => st.id).join('/')}`).join(', '),
    );
  }

  if (errors.length > 0) {
    console.error(errors.map((e) => `✗ ${e}`).join('\n'));
    process.exit(1);
  }
  console.log(
    `✓ storyboard valid — ${sb.scenes.length} scenes, ${sb.width}x${sb.height}@${sb.fps}`,
  );
};

await main();
