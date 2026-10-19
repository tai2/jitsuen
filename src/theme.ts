import type {CSSProperties} from 'react';
import {useVideoConfig} from 'remotion';
import {accent, caption, sizes, surfaces} from '../video/tokens.ts';
import {JA_STACK} from './fonts.ts';

/**
 * Theme MECHANISM. The values live in `video/tokens.ts`, because a palette and a type scale
 * belong to one video, while the scaling rule and the helpers below belong to the tool.
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
  surfaces,
  accent,
  caption,
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
} as const;

const REFERENCE_SHORT_EDGE = 1080;

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
 * A low-contrast radial wash instead of a flat fill — enough to give the frame depth behind
 * a letterboxed screenshot, not enough to read as a gradient.
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
