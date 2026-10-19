import type {Surface, SurfaceName} from '../src/theme.ts';

/**
 * The visual identity of THIS video. Mechanism lives in src/theme.ts; only values live here,
 * so a reference-match touches one file and never the scene components.
 *
 * TO MATCH A REFERENCE: change `surfaces`, `accent` and `sizes`.
 *
 * The default is "sumi": warm ink charcoal rather than tinted black, washi off-white rather
 * than pure white, and a single muted moss accent used structurally — rules and markers —
 * rather than as decoration.
 */

export const surfaces = {
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
} satisfies Record<SurfaceName, Surface>;

/** One accent. Spend boldness in one place. */
export const accent = '#8a9a5b';

/**
 * Captions sit over arbitrary footage, so they do NOT follow the surface — always a dark
 * scrim with light text, the only pairing legible over both bright and dark screenshots.
 */
export const caption = {
  background: 'rgba(22, 24, 18, 0.84)',
  text: '#f2efe6',
  lineHeight: 1.45,
};

/**
 * Every length is given for a 1080px SHORT EDGE and scaled to the real frame by
 * useMetrics(). Scaling on the short edge rather than the width is what makes one set of
 * numbers work for both a 1920x1080 landscape video and a 1080x2348 portrait one: type size
 * tracks viewing distance, which follows the short edge in either orientation.
 *
 * Check the longest real string against `width − 2 × margin` before raising these. Vertical
 * video wants noticeably larger type than landscape.
 */
export const sizes = {
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
