import {z} from 'zod';

const SceneBase = {
  id: z.string().regex(/^[a-z0-9-]+$/, 'kebab-case, used as a filename and a JSX name'),
  /** Japanese narration. null = a deliberately silent beat. */
  narration: z.string().min(1).nullable(),
  /** Seconds of silence held before/after the narration inside this scene. */
  padBefore: z.number().min(0).max(5).default(0.3),
  padAfter: z.number().min(0).max(5).default(0.5),
  /** Floor on scene length — the only length source for a silent scene. */
  minSeconds: z.number().min(0.5).max(60).default(2),
  /** Words/phrases to emit cue frames for. */
  cues: z.array(z.string()).default([]),
};

export const SceneSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...SceneBase,
      type: z.literal('title'),
      title: z.string(),
      subtitle: z.string().optional(),
    })
    .strict(),
  z
    .object({
      ...SceneBase,
      type: z.literal('screenshot'),
      asset: z.string(),
      caption: z.string().optional(),
      focus: z
        .object({x: z.number(), y: z.number(), scale: z.number().min(1).max(4)})
        .strict()
        .optional(),
    })
    .strict(),
  z
    .object({
      ...SceneBase,
      type: z.literal('screencast'),
      asset: z.string(),
      trimBeforeSeconds: z.number().min(0).default(0),
      playbackRate: z.number().min(0.25).max(4).default(1),
      /** Keep the clip's own audio under the narration? Usually false for demos. */
      keepClipAudio: z.boolean().default(false),
    })
    .strict(),
  z
    .object({
      ...SceneBase,
      type: z.literal('bullets'),
      heading: z.string(),
      bullets: z.array(z.string()).min(1).max(5),
    })
    .strict(),
  z
    .object({
      ...SceneBase,
      type: z.literal('outro'),
      message: z.string(),
      url: z.string().optional(),
    })
    .strict(),
]);

export const StoryboardSchema = z
  .object({
    project: z.string().regex(/^[a-z0-9-]+$/),
    fps: z.union([z.literal(24), z.literal(30), z.literal(60)]).default(30),
    // Even dimensions for h264/yuv420p.
    width: z.number().int().multipleOf(2),
    height: z.number().int().multipleOf(2),
    voice: z
      .object({
        styleId: z.number().int(),
        speed: z.number().min(0.5).max(2).default(1.0),
        sampleRate: z.literal(48000).default(48000),
      })
      .strict(),
    /** Literal reading overrides applied before /audio_query. */
    readings: z.record(z.string(), z.string()).default({}),
    showCaptions: z.boolean().default(true),
    scenes: z.array(SceneSchema).min(1),
  })
  .strict();

export type Storyboard = z.infer<typeof StoryboardSchema>;
export type Scene = z.infer<typeof SceneSchema>;
