import {Img, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  backdropStyle,
  markerStyle,
  surfaceSchemaField,
  theme,
  useMetrics,
  type SurfaceName,
} from '../theme.ts';

type Props = {
  readonly asset: string;
  readonly caption: string;
  readonly focusX: number;
  readonly focusY: number;
  readonly focusScale: number;
  readonly surface?: SurfaceName;
};

const ScreenshotSceneInner = ({
  asset,
  caption,
  focusX,
  focusY,
  focusScale,
  surface = 'ink',
}: Props) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const m = useMetrics();

  return (
    <>
      {/* The wash shows wherever objectFit: 'contain' letterboxes the screenshot. */}
      <div style={backdropStyle(surface)} />
      <Img
        src={staticFile(`assets/${asset}`)}
        style={{
          // Positioned, not in flow: the backdrop above is `position: absolute`, and a
          // positioned sibling paints over every non-positioned one regardless of DOM
          // order. Left static, the image is drawn and then covered by the opaque wash.
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          // objectFit: 'contain' is why image dimensions are never probed in Node.
          objectFit: 'contain',
          transformOrigin: `${focusX}% ${focusY}%`,
          // Slow Ken Burns push toward the focus point.
          scale: String(
            interpolate(frame, [0, durationInFrames - 1], [1, focusScale], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              output: 'perceptual-scale',
            }),
          ),
          opacity: interpolate(frame, [0, theme.motion.enterSeconds * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
      {caption ? (
        <div
          style={{
            position: 'absolute',
            // Sits above the caption band, clear of the title-safe area.
            bottom: m.lowerThird,
            left: m.margin,
            right: m.margin,
            display: 'flex',
            alignItems: 'center',
            gap: m.gap,
            fontFamily: theme.family,
            fontWeight: theme.weightBold,
            fontSize: m.heading,
            letterSpacing: theme.tracking,
            color: theme.surfaces.ink.text,
            textShadow: '0 4px 28px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div style={markerStyle(m, m.heading)} />
          {caption}
        </div>
      ) : null}
    </>
  );
};

export const ScreenshotScene = Interactive.create({
  Component: ScreenshotSceneInner,
  layout: 'absolute-fill',
  componentName: '<ScreenshotScene>',
  schema: {
    surface: surfaceSchemaField,
    asset: {type: 'asset', assetType: 'image', default: '', description: 'File in public/assets'},
    caption: {type: 'string', default: '', description: 'On-screen caption'},
    focusX: {type: 'number', default: 50, description: 'Zoom origin X (%)', hiddenFromList: false},
    focusY: {type: 'number', default: 50, description: 'Zoom origin Y (%)', hiddenFromList: false},
    focusScale: {
      type: 'number',
      default: 1,
      min: 1,
      max: 4,
      step: 0.01,
      description: 'End zoom scale',
      hiddenFromList: false,
    },
  },
});
