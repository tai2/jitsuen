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
  readonly title: string;
  readonly subtitle: string;
  readonly surface?: SurfaceName;
};

const TitleSceneInner = ({title, subtitle, surface = 'ink'}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = useMetrics();
  const s = surfaceOf(surface);

  // One orchestrated entrance: the marker draws, then the words arrive under it.
  const draw = interpolate(frame, [0, 0.45 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
          paddingInline: m.margin,
          fontFamily: theme.family,
        }}
      >
        <div style={{display: 'flex', gap: m.gap + 8}}>
          <div style={{...markerStyle(m, 176), scale: `1 ${draw}`, transformOrigin: 'top'}} />
          <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
            <div
              style={{
                fontSize: m.display,
                fontWeight: theme.weightBold,
                lineHeight: theme.lineHeightTight,
                letterSpacing: theme.tracking,
                color: s.text,
                translate: `0px ${interpolate(frame, [0.2 * fps, 0.75 * fps], [theme.motion.riseFrom, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px`,
                opacity: interpolate(frame, [0.2 * fps, 0.75 * fps], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  fontSize: m.heading,
                  fontWeight: theme.weightRegular,
                  letterSpacing: theme.tracking,
                  color: s.textMuted,
                  opacity: interpolate(frame, [0.45 * fps, 1 * fps], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export const TitleScene = Interactive.create({
  Component: TitleSceneInner,
  layout: 'absolute-fill',
  componentName: '<TitleScene>',
  schema: {
    surface: surfaceSchemaField,
    title: {type: 'string', default: '', description: 'Headline'},
    subtitle: {type: 'string', default: '', description: 'Sub-headline'},
  },
});
