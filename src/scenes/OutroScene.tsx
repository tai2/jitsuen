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
  readonly message: string;
  readonly url: string;
  readonly surface?: SurfaceName;
};

const OutroSceneInner = ({message, url, surface = 'ink'}: Props) => {
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
          gap: m.gap + 12,
          paddingInline: m.margin,
          fontFamily: theme.family,
          opacity: interpolate(frame, [0, theme.motion.enterSeconds * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <div style={{display: 'flex', gap: m.gap + 8}}>
          <div style={{...markerStyle(m, m.title * theme.lineHeightTight)}} />
          <div
            style={{
              fontSize: m.title,
              fontWeight: theme.weightBold,
              lineHeight: theme.lineHeightTight,
              letterSpacing: theme.tracking,
              color: s.text,
            }}
          >
            {message}
          </div>
        </div>
        {url ? (
          <div
            style={{
              marginLeft: m.markerWidth + m.gap + 8,
              fontSize: m.body,
              letterSpacing: theme.tracking,
              color: s.textMuted,
              // A rule under the address, not a box around it.
              borderBottom: `${m.hairline}px solid ${theme.accent}`,
              paddingBottom: 10,
              alignSelf: 'flex-start',
            }}
          >
            {url}
          </div>
        ) : null}
      </div>
    </>
  );
};

export const OutroScene = Interactive.create({
  Component: OutroSceneInner,
  layout: 'absolute-fill',
  componentName: '<OutroScene>',
  schema: {
    surface: surfaceSchemaField,
    message: {type: 'string', default: '', description: 'Closing message'},
    url: {type: 'string', default: '', description: 'Link to show (optional)'},
  },
});
