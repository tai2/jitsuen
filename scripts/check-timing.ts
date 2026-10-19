import {readFile} from 'node:fs/promises';
import {buildTimeline} from '../src/timeline.ts';
import {StoryboardSchema} from './lib/storyboard-schema.ts';

const TSX = 'video/DemoVideo.tsx';

const main = async () => {
  const sb = StoryboardSchema.parse(JSON.parse(await readFile('video/storyboard.json', 'utf8')));


  const tsx = await readFile(TSX, 'utf8');
  const expected = buildTimeline(sb.scenes, sb.fps);

  const missing: string[] = [];
  const stale: string[] = [];

  for (const t of expected) {
    // The authored block for a scene is identified by name="<scene id>". Regex-parsing TSX
    // is crude, but the file has a known author and a known shape, and the failure mode is
    // a precise error rather than a wrong video.
    const block = tsx.match(new RegExp(`name="${t.id}"[\\s\\S]{0,800}?/>`));
    if (!block) {
      missing.push(`scene "${t.id}": no JSX node with name="${t.id}" in ${TSX}`);
      continue;
    }
    const from = Number(block[0].match(/from=\{(\d+)\}/)?.[1] ?? 0);
    const dur = Number(block[0].match(/durationInFrames=\{(\d+)\}/)?.[1] ?? NaN);
    if (from !== t.fromFrame) {
      stale.push(`scene "${t.id}": from={${from}} should be from={${t.fromFrame}}`);
    }
    if (dur !== t.durationInFrames) {
      stale.push(
        `scene "${t.id}": durationInFrames={${Number.isNaN(dur) ? 'absent' : dur}} ` +
          `should be durationInFrames={${t.durationInFrames}}`,
      );
    }
  }

  if (missing.length > 0 || stale.length > 0) {
    if (missing.length > 0) {
      console.error(`✗ ${missing.length} scene(s) not found in ${TSX}:`);
      console.error(missing.map((p) => `  ${p}`).join('\n'));
      console.error('\nAdd an authored JSX block for each, then re-run.');
    }
    if (stale.length > 0) {
      console.error(`✗ ${stale.length} baked frame number(s) are stale:`);
      console.error(stale.map((p) => `  ${p}`).join('\n'));
      console.error(`\nFix the literals in ${TSX} to the values above.`);
    }
    process.exit(1);
  }

  const last = expected.at(-1);
  console.log(
    `✓ timing consistent — ${expected.length} scenes, ` +
      `${last ? last.fromFrame + last.durationInFrames : 0} frames ` +
      `at ${sb.width}x${sb.height}@${sb.fps}`,
  );
};

await main();
