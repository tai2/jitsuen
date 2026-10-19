import {readFile} from 'node:fs/promises';
import {
  buildAttrs,
  buildTimeline,
  framesFromAttr,
  totalFrames,
  totalSecondsAttr,
  type CaptionPage,
} from '../src/timeline.ts';
import {StoryboardSchema} from './lib/storyboard-schema.ts';

const ROOT = 'index.html';
const TOKENS = 'video/tokens.css';
const sceneFile = (id: string) => `video/scenes/${id}.html`;

type NarrationScene = {
  wav: string | null;
  durationSec: number;
  captions: {startMs: number; endMs: number}[];
};
type Narration = {scenes: Record<string, NarrationScene>};
type VideoAsset = {kind: string; durationInSeconds?: number};

/** Read one data-* attribute off the element carrying `id="<id>"`. */
const attrOf = (html: string, id: string, attr: string): string | null => {
  const block = html.match(new RegExp(`id="${id}"[^>]*>`));
  if (!block) return null;
  return block[0].match(new RegExp(`${attr}="([^"]*)"`))?.[1] ?? null;
};

const main = async () => {
  const sb = StoryboardSchema.parse(JSON.parse(await readFile('video/storyboard.json', 'utf8')));
  const narration = JSON.parse(await readFile('video/narration.json', 'utf8')) as Narration;
  const assets = JSON.parse(await readFile('video/assets.json', 'utf8')) as {
    assets: Record<string, VideoAsset>;
  };
  const html = await readFile(ROOT, 'utf8');
  const tokens = await readFile(TOKENS, 'utf8');

  const captionsByScene: Record<string, CaptionPage[]> = {};
  for (const [id, scene] of Object.entries(narration.scenes)) {
    captionsByScene[id] = scene.captions.map((c) => ({startMs: c.startMs, endMs: c.endMs}));
  }

  const timeline = buildTimeline(sb.scenes, sb.fps);
  const expected = buildAttrs(timeline, sb.fps, captionsByScene);

  const problems: string[] = [];
  const check = (what: string, actual: string | null, want: string) => {
    if (actual === null) problems.push(`${what}: missing — should be "${want}"`);
    else if (actual !== want) problems.push(`${what}: "${actual}" should be "${want}"`);
  };

  // A timeline length is compared as a NUMBER, not as text: `5.0` and `5.000000` are the
  // same length, and a script that writes one of them is not stale. Attributes stay an
  // exact string comparison, because those are pasted literals and drift there is real.
  const checkSeconds = (what: string, actual: string | null, want: string) => {
    if (actual === null) problems.push(`${what}: missing — should be ${want}`);
    else if (Number(actual) !== Number(want)) {
      problems.push(`${what}: ${actual} should be ${want}`);
    }
  };

  // ── The 3274baf guard, in its new form. width/height/fps live in storyboard.json and
  // are mirrored as literals on the root; nothing derives them at runtime any more.
  check('root data-width', attrOf(html, 'stage', 'data-width'), String(sb.width));
  check('root data-height', attrOf(html, 'stage', 'data-height'), String(sb.height));
  check('root data-fps', attrOf(html, 'stage', 'data-fps'), String(sb.fps));

  // --short-edge drives every scaled length in src/theme.css and has no other check.
  const shortEdge = tokens.match(/--short-edge:\s*([0-9.]+)/)?.[1] ?? null;
  check(`${TOKENS} --short-edge`, shortEdge, String(Math.min(sb.width, sb.height)));

  // ── The keystone. A composition's length is its GSAP timeline's length — there is no
  // data-duration on a composition — so the literal that matters is the argument to the
  // master timeline's final tl.set(). Get this wrong and the video is silently truncated.
  const total = totalSecondsAttr(timeline, sb.fps);
  const rootSet = html.match(/tl\.set\(\{\},\s*\{\},\s*([0-9.]+)\)/)?.[1] ?? null;
  checkSeconds(`${ROOT} master tl.set() total`, rootSet, total);

  for (const scene of expected) {
    const file = sceneFile(scene.id);
    let sceneHtml: string;
    try {
      sceneHtml = await readFile(file, 'utf8');
    } catch {
      problems.push(`scene "${scene.id}": ${file} is missing`);
      continue;
    }

    // Lane 1 — the scene host. Found by id and nothing else.
    check(`scene "${scene.id}" data-start`, attrOf(html, scene.id, 'data-start'), scene.start);

    // Each scene sub-composition carries its own length the same way the root does.
    const sceneSet = sceneHtml.match(/Motion\("[^"]+",\s*([0-9.]+)/)?.[1] ?? null;
    if (sceneSet === null) {
      problems.push(`scene "${scene.id}": ${file} has no motion call with a length argument`);
    } else {
      checkSeconds(`scene "${scene.id}" ${file} length`, sceneSet, scene.duration);
    }

    // Lane 2 — narration. An <audio> without an id is skipped by the mixer and the render
    // is silent with no error, so absence is checked explicitly rather than inferred.
    if (scene.narrationStart !== null) {
      const audioId = `${scene.id}-narration`;
      if (!new RegExp(`<audio[^>]*id="${audioId}"`).test(html)) {
        problems.push(
          `scene "${scene.id}": no <audio id="${audioId}"> — a missing id renders SILENT with no error`,
        );
      } else {
        check(`narration "${audioId}" data-start`, attrOf(html, audioId, 'data-start'), scene.narrationStart);
        check(
          `narration "${audioId}" data-duration`,
          attrOf(html, audioId, 'data-duration'),
          scene.narrationDuration ?? '',
        );
      }
    }

    // Lane 3 — captions. Equally derived, equally hand-written, so equally checked.
    for (const caption of scene.captions) {
      check(`caption "${caption.id}" data-start`, attrOf(html, caption.id, 'data-start'), caption.start);
      check(
        `caption "${caption.id}" data-duration`,
        attrOf(html, caption.id, 'data-duration'),
        caption.duration,
      );
    }
  }

  // ── Every emitted start must round-trip to the frame it names. This is what lets the
  // rest of the pipeline keep thinking in frames while the HTML is written in seconds.
  for (const scene of expected) {
    for (const [what, value] of [
      [`scene "${scene.id}"`, scene.start],
      ...scene.captions.map((c) => [`caption "${c.id}"`, c.start] as const),
    ] as const) {
      const frame = framesFromAttr(value, sb.fps);
      if (Number(value) > frame / sb.fps + 1e-9) {
        problems.push(`${what}: data-start "${value}" is later than frame ${frame} (${frame / sb.fps})`);
      }
    }
  }

  // ── The screencast footage budget, moved here from validate.ts and made exact. The old
  // check used minSeconds x rate, which ignores that a scene is actually as long as its
  // narration needs; splash passed with ~0.95s of apparent headroom and 0.09s of real.
  for (let i = 0; i < sb.scenes.length; i++) {
    const spec = sb.scenes[i];
    if (spec.type !== 'screencast') continue;
    const asset = assets.assets[spec.asset];
    if (!asset || asset.kind !== 'video' || asset.durationInSeconds === undefined) {
      problems.push(`scene "${spec.id}": no probed duration for "${spec.asset}" — run pnpm ingest`);
      continue;
    }
    const sceneSeconds = timeline[i].durationInFrames / sb.fps;
    const needed = spec.trimBeforeSeconds + sceneSeconds * spec.playbackRate;
    if (needed > asset.durationInSeconds + 1e-6) {
      problems.push(
        `scene "${spec.id}": needs ${needed.toFixed(3)}s of "${spec.asset}" ` +
          `(trim ${spec.trimBeforeSeconds} + ${sceneSeconds.toFixed(3)}s x ${spec.playbackRate}) ` +
          `but the clip is only ${asset.durationInSeconds.toFixed(3)}s — it will freeze on its last frame`,
      );
    }
  }

  if (problems.length > 0) {
    console.error(`✗ ${problems.length} problem(s):`);
    console.error(problems.map((p) => `  ${p}`).join('\n'));
    console.error('\nFix the literals above, then re-run.');
    process.exit(1);
  }

  console.log(
    `✓ timing consistent — ${expected.length} scenes, ` +
      `${expected.reduce((n, s) => n + s.captions.length, 0)} captions, ` +
      `${totalFrames(timeline)} frames (${total}s) at ${sb.width}x${sb.height}@${sb.fps}`,
  );
};

await main();
