import narration from './generated/narration.json' with {type: 'json'};

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
