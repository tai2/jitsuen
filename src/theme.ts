import type {CSSProperties} from 'react';
import {useVideoConfig} from 'remotion';
import {JA_STACK} from './fonts.ts';

/**
 * Design tokens for the whole video.
 *
 * TO MATCH A REFERENCE: change `surfaces` and `accent` for colour, and `sizes` for the
 * type scale. Nothing else should need touching — every scene derives its look from here,
 * so this file is the only place the visual identity lives.
 *
 * The default is "sumi": warm ink charcoal rather than tinted black, washi off-white
 * rather than pure white, and a single muted moss accent used structurally — rules and
 * markers — rather than as decoration. Japanese is set with a little positive tracking,
 * because Noto Sans JP sets kana and kanji tightly at display sizes.
 */

export type SurfaceName = 'ink' | 'paper';

export type Surface = {
  /** Lightest point of the backdrop wash. */
  lift: string;
  /** The flat base colour. */
  base: string;
  /** Darkest point of the wash, at the far corner. */
  edge: string;
  text: string;
  textMuted: string;
  rule: string;
};

export const theme = {
  surfaces: {
    ink: {
      lift: '#2b2e26',
      base: '#22241f',
      edge: '#171812',
      text: '#f2efe6',
      textMuted: '#a29f90',
      rule: 'rgba(242, 239, 230, 0.20)',
    },
    paper: {
      lift: '#faf8f1',
      base: '#f2efe6',
      edge: '#e3ded0',
      text: '#22241f',
      textMuted: '#6d6b5e',
      rule: 'rgba(34, 36, 31, 0.18)',
    },
  } satisfies Record<SurfaceName, Surface>,

  /** One accent. Spend boldness in one place. */
  accent: '#8a9a5b',

  family: JA_STACK,
  weightRegular: 400,
  weightBold: 700,
  lineHeightTight: 1.25,
  lineHeightBody: 1.6,
  /** Japanese needs a little air between kana and kanji at display sizes. */
  tracking: '0.02em',

  motion: {
    enterSeconds: 0.5,
    staggerSeconds: 0.3,
    riseFrom: 28,
  },

  /**
   * Captions sit over arbitrary footage, so they do NOT follow the surface — always a dark
   * scrim with light text, the only combination legible over both a bright screenshot and
   * a dark one. Caption *position* is authored per video in DemoVideo.tsx; only the type
   * and the scrim come from here.
   */
  caption: {
    background: 'rgba(22, 24, 18, 0.84)',
    text: '#f2efe6',
    lineHeight: 1.45,
  },
} as const;

/**
 * Every length below is given for a 1080px SHORT EDGE and scaled to the real frame.
 *
 * Scaling on the short edge rather than the width is what makes one set of numbers work
 * for both a 1920x1080 landscape demo and a 1080x2348 portrait one: type size tracks
 * viewing distance, which follows the short edge in either orientation.
 */
const REFERENCE_SHORT_EDGE = 1080;

const sizes = {
  // Sized against the longest real strings at a 1080 short edge: 920px of usable width
  // after margins, so a 13-character mixed-script title has room at 88px and a
  // 12-character bullet at 44px. Vertical video wants type with presence — these are
  // deliberately large, because a small centred block in a 2348px-tall frame reads as an
  // island rather than a composition.
  display: 88,
  title: 68,
  heading: 60,
  body: 44,
  label: 30,
  captionText: 44,
  margin: 80,
  gap: 26,
  markerWidth: 6,
  hairline: 2,
  /** Where a scene's own caption sits, clear of the narration caption band. */
  lowerThird: 360,
  captionPaddingBlock: 14,
  captionPaddingInline: 26,
  captionRadius: 4,
} as const;

export type Metrics = {
  -readonly [K in keyof typeof sizes]: number;
};

export const useMetrics = (): Metrics => {
  const {width, height} = useVideoConfig();
  const k = Math.min(width, height) / REFERENCE_SHORT_EDGE;
  const out: Partial<Metrics> = {};
  for (const [key, value] of Object.entries(sizes)) {
    out[key as keyof Metrics] = Math.max(1, Math.round(value * k));
  }
  return out as Metrics;
};

export const surfaceOf = (name: SurfaceName): Surface => theme.surfaces[name];

/**
 * A low-contrast radial wash instead of a flat fill — enough to give the frame depth
 * behind a letterboxed screenshot, not enough to read as a gradient.
 */
export const backdropStyle = (name: SurfaceName): CSSProperties => {
  const s = surfaceOf(name);
  return {
    position: 'absolute',
    inset: 0,
    background: `radial-gradient(120% 90% at 18% 12%, ${s.lift} 0%, ${s.base} 58%, ${s.edge} 100%)`,
  };
};

/** The accent bar that anchors a title or marks a list item. */
export const markerStyle = (m: Metrics, height: number | string): CSSProperties => ({
  width: m.markerWidth,
  height,
  backgroundColor: theme.accent,
  flexShrink: 0,
});

export const surfaceSchemaField = {
  type: 'enum',
  default: 'ink',
  description: 'Surface',
  variants: {ink: {}, paper: {}},
} as const;
