import {readFile} from 'node:fs/promises';
import type {Storyboard} from './storyboard-schema.ts';

const ROOT_TSX = 'src/Root.tsx';
const METADATA_TS = 'src/metadata.ts';

/**
 * `width`, `height` and `fps` live in three hand-mirrored places: `input/storyboard.json`,
 * the `<Composition>` registrations in `src/Root.tsx`, and `COMPOSITION_FPS` in
 * `src/metadata.ts`. `Root.tsx` is the one that governs the render, but the scripts bake
 * frame numbers from the storyboard's `fps` — `check-timing.ts` derives the expected
 * timeline from it and `synthesize.ts` derives caption cue frames from it. An fps mismatch
 * is therefore self-consistent to every other check and only shows up as audio and visuals
 * drifting apart in the finished mp4. This parses the literals back out and refuses the
 * mismatch.
 *
 * Regex-parsing TSX is crude, but — as in `check-timing.ts` — the files have a known author
 * and a known shape, and an unparseable file is reported rather than skipped.
 */

type Registration = {
  readonly id: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly fps: number | null;
};

const attr = (head: string, name: string): number | null => {
  const found = head.match(new RegExp(`\\b${name}=\\{(\\d+)\\}`));
  return found ? Number(found[1]) : null;
};

const registrations = (tsx: string): Registration[] =>
  tsx
    .split('<Composition')
    .slice(1)
    // Cut at defaultProps so a prop that happens to be named width/height/fps cannot be
    // mistaken for the registration's own.
    .map((chunk) => chunk.split('defaultProps')[0])
    .map((head, i) => ({
      id: head.match(/\bid="([^"]+)"/)?.[1] ?? `(unnamed, #${i + 1})`,
      width: attr(head, 'width'),
      height: attr(head, 'height'),
      fps: attr(head, 'fps'),
    }));

/** Problems to report, or an empty array. Never throws on a shape it cannot read. */
export const checkCompositionConfig = async (sb: Storyboard): Promise<string[]> => {
  const problems: string[] = [];
  const expected = {width: sb.width, height: sb.height, fps: sb.fps} as const;

  const found = registrations(await readFile(ROOT_TSX, 'utf8'));
  if (found.length === 0) {
    problems.push(`${ROOT_TSX}: no <Composition> registration found — cannot verify the format`);
  }

  for (const reg of found) {
    for (const key of ['width', 'height', 'fps'] as const) {
      const actual = reg[key];
      if (actual === null) {
        problems.push(`${ROOT_TSX}: <Composition id="${reg.id}"> has no literal ${key}={...}`);
      } else if (actual !== expected[key]) {
        problems.push(
          `${ROOT_TSX}: <Composition id="${reg.id}"> has ${key}={${actual}} but ` +
            `input/storyboard.json says ${key} ${expected[key]}`,
        );
      }
    }
  }

  const metadata = await readFile(METADATA_TS, 'utf8');
  const compositionFps = metadata.match(/\bCOMPOSITION_FPS\s*=\s*(\d+)/)?.[1];
  if (compositionFps === undefined) {
    problems.push(`${METADATA_TS}: no COMPOSITION_FPS = <number> found — cannot verify the fps`);
  } else if (Number(compositionFps) !== sb.fps) {
    problems.push(
      `${METADATA_TS}: COMPOSITION_FPS = ${compositionFps} but ` +
        `input/storyboard.json says fps ${sb.fps}`,
    );
  }

  return problems;
};
