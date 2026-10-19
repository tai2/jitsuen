import {Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  backdropStyle,
  markerStyle,
  surfaceOf,
  surfaceSchemaField,
  theme,
  useMetrics,
  type SurfaceName,
} from '../theme.ts';

type Props = {
  readonly heading: string;
  readonly bullets: readonly string[];
  readonly surface?: SurfaceName;
};

const BulletsSceneInner = ({heading, bullets, surface = 'ink'}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = useMetrics();
  const s = surfaceOf(surface);

  return (
    <>
      <div style={backdropStyle(surface)} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: m.gap,
          paddingInline: m.margin,
          fontFamily: theme.family,
        }}
      >
        <div
          style={{
            fontSize: m.title,
            fontWeight: theme.weightBold,
            letterSpacing: theme.tracking,
            color: s.text,
          }}
        >
          {heading}
        </div>
        {/* Hairline under the heading: it marks where the list begins. */}
        <div
          style={{
            height: m.hairline,
            width: 140,
            backgroundColor: theme.accent,
            marginBottom: m.gap,
            scale: `${interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} 1`,
            transformOrigin: 'left',
          }}
        />
        {bullets.map((bullet, i) => (
          <div
            key={bullet}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: m.gap,
              fontSize: m.body,
              lineHeight: theme.lineHeightBody,
              letterSpacing: theme.tracking,
              color: s.text,
              // Staggered by index, not by wall-clock: deterministic across the parallel
              // tabs a render uses.
              opacity: interpolate(
                frame,
                [(0.5 + i * theme.motion.staggerSeconds) * fps, (1 + i * theme.motion.staggerSeconds) * fps],
                [0, 1],
                {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
              ),
              translate: `${interpolate(
                frame,
                [(0.5 + i * theme.motion.staggerSeconds) * fps, (1 + i * theme.motion.staggerSeconds) * fps],
                [theme.motion.riseFrom, 0],
                {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
              )}px 0px`,
            }}
          >
            <div style={markerStyle(m, m.body)} />
            {bullet}
          </div>
        ))}
      </div>
    </>
  );
};

export const BulletsScene = Interactive.create({
  Component: BulletsSceneInner,
  layout: 'absolute-fill',
  componentName: '<BulletsScene>',
  schema: {
    surface: surfaceSchemaField,
    heading: {type: 'string', default: '', description: 'Section heading'},
    // Hidden rather than editable: Remotion 4.0.536's array item schema has no string
    // variant, so bullet text is edited in storyboard.json and DemoVideo.tsx.
    bullets: {type: 'hidden'},
  },
});
