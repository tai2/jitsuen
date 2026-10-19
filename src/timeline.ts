import narration from '../video/narration.json' with {type: 'json'};

export type SceneTiming = {
  id: string;
  /** Absolute start in the parent timeline. */
  fromFrame: number;
  durationInFrames: number;
  /** Narration start, relative to the scene. */
  audioFromFrame: number;
  audioDurationInFrames: number;
  wav: string | null;
};

export type SceneSpec = {
  id: string;
  padBefore: number;
  padAfter: number;
  minSeconds: number;
};

type NarrationEntry = {durationSec: number; wav: string | null};

export const buildTimeline = (specs: SceneSpec[], fps: number): SceneTiming[] => {
  const out: SceneTiming[] = [];
  let cumulativeSeconds = 0;

  for (const spec of specs) {
    const n = (narration.scenes as Record<string, NarrationEntry>)[spec.id];
    if (!n) throw new Error(`no narration entry for scene "${spec.id}" — run: pnpm voice`);

    const audioSeconds = n.durationSec;
    const sceneSeconds = Math.max(spec.padBefore + audioSeconds + spec.padAfter, spec.minSeconds);

    // Round each BOUNDARY from the running total; never sum rounded values. Summing
    // per-scene Math.ceil is what makes late-video subtitles drift off the audio.
    const fromFrame = Math.round(cumulativeSeconds * fps);
    const endFrame = Math.round((cumulativeSeconds + sceneSeconds) * fps);

    out.push({
      id: spec.id,
      fromFrame,
      durationInFrames: endFrame - fromFrame,
      audioFromFrame: Math.round(spec.padBefore * fps),
      audioDurationInFrames: Math.ceil(audioSeconds * fps),
      wav: n.wav,
    });

    cumulativeSeconds += sceneSeconds;
  }
  return out;
};

export const totalFrames = (t: SceneTiming[]) => {
  const last = t.at(-1);
  return last ? last.fromFrame + last.durationInFrames : 1;
};

/**
 * HyperFrames reads data-start / data-duration as SECONDS, while src/timeline.ts above
 * works in frames. This is the only place the two meet.
 *
 * Why floor rather than round: NOT because rounding up loses a frame. The milestone-1
 * spike tested exactly that — two adjacent clips with the boundary at frame 215, emitted
 * both as 7.166666 and as 7.166667 — and both put frame 215 on the second clip, because
 * the renderer quantises seconds back to frames rather than comparing raw floats. The
 * reason to floor is narrower and duller: `pnpm check` re-derives these strings and
 * compares them, so there must be exactly ONE derivation. Two defensible roundings that
 * disagree on two of ten scenes is a false-positive generator.
 *
 * 6 decimals round-trips exactly for every fps the storyboard schema allows (24/30/60)
 * well past any plausible video length; scripts/check-timing.ts asserts that rather than
 * trusting it.
 */
export const secondsAttr = (frames: number, fps: number): string =>
  (Math.floor((frames / fps) * 1e6) / 1e6).toFixed(6);

/** Recover the frame an emitted attribute names. Used by pnpm check. */
export const framesFromAttr = (attr: string, fps: number): number =>
  Math.round(Number.parseFloat(attr) * fps);

export type CaptionAttrs = {
  id: string;
  start: string;
  duration: string;
};

export type SceneAttrs = {
  id: string;
  start: string;
  duration: string;
  /** Absolute narration start, or null for a scene with no narration. */
  narrationStart: string | null;
  narrationDuration: string | null;
  captions: CaptionAttrs[];
};

export type CaptionPage = {startMs: number; endMs: number};

/**
 * Everything the authored composition needs, as the exact strings that belong in the
 * attributes. Durations are differences between EMITTED starts, not independently floored
 * values, so clip N ends exactly where clip N+1 begins and there is no 1 microsecond
 * seam between them.
 */
export const buildAttrs = (
  timeline: SceneTiming[],
  fps: number,
  captionsByScene: Record<string, CaptionPage[]> = {},
): SceneAttrs[] =>
  timeline.map((scene, i) => {
    const next = timeline[i + 1];
    const start = secondsAttr(scene.fromFrame, fps);
    const endAttr = next
      ? secondsAttr(next.fromFrame, fps)
      : secondsAttr(scene.fromFrame + scene.durationInFrames, fps);
    const duration = (Number(endAttr) - Number(start)).toFixed(6);

    const audioFrom = scene.fromFrame + scene.audioFromFrame;
    const pages = captionsByScene[scene.id] ?? [];

    return {
      id: scene.id,
      start,
      duration,
      narrationStart: scene.wav ? secondsAttr(audioFrom, fps) : null,
      narrationDuration: scene.wav
        ? secondsAttr(scene.audioDurationInFrames, fps)
        : null,
      captions: pages.map((page, p) => {
        // A page runs until the next page starts; the last runs to its own endMs. This
        // mirrors createTikTokStyleCaptions' paging, which the Remotion build derived at
        // render time and which is now resolved once, at authoring time.
        const nextPage = pages[p + 1];
        const pageStartFrame = audioFrom + Math.round((page.startMs / 1000) * fps);
        const pageEndFrame = nextPage
          ? audioFrom + Math.round((nextPage.startMs / 1000) * fps)
          : audioFrom + Math.round((page.endMs / 1000) * fps);
        const cStart = secondsAttr(pageStartFrame, fps);
        const cEnd = secondsAttr(pageEndFrame, fps);
        return {
          id: `${scene.id}-caption-${p + 1}`,
          start: cStart,
          duration: (Number(cEnd) - Number(cStart)).toFixed(6),
        };
      }),
    };
  });

/** Total composition length in seconds, as the literal the master timeline is extended to. */
export const totalSecondsAttr = (t: SceneTiming[], fps: number): string =>
  secondsAttr(totalFrames(t), fps);
