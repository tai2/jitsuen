import {Video} from '@remotion/media';
import {Interactive, staticFile, useVideoConfig} from 'remotion';
import {backdropStyle, surfaceSchemaField, type SurfaceName} from '../theme.ts';

type Props = {
  readonly asset: string;
  readonly trimBeforeSeconds: number;
  readonly clipPlaybackRate: number;
  readonly keepClipAudio: boolean;
  readonly surface?: SurfaceName;
};

const ScreencastSceneInner = ({
  asset,
  trimBeforeSeconds,
  clipPlaybackRate,
  keepClipAudio,
  surface = 'ink',
}: Props) => {
  const {durationInFrames, fps} = useVideoConfig();

  return (
    <>
      <div style={backdropStyle(surface)} />
      <Video
      src={staticFile(`assets/${asset}`)}
      trimBefore={Math.round(trimBeforeSeconds * fps)}
      durationInFrames={durationInFrames}
      playbackRate={clipPlaybackRate}
      muted={!keepClipAudio}
      // Duck hard under the narration rather than competing with it.
      volume={keepClipAudio ? 0.15 : 0}
      objectFit="contain"
      // Positioned, not in flow: the backdrop above is `position: absolute`, and a
      // positioned sibling paints over every non-positioned one regardless of DOM order.
      // Left static, the clip renders correctly and is then covered by the opaque wash.
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
      // Make a codec fallback LOUD instead of a silently degraded render.
        onError={() => 'fail'}
      />
    </>
  );
};

export const ScreencastScene = Interactive.create({
  Component: ScreencastSceneInner,
  layout: 'absolute-fill',
  componentName: '<ScreencastScene>',
  schema: {
    surface: surfaceSchemaField,
    asset: {type: 'asset', assetType: 'video', default: '', description: 'File in public/assets'},
    trimBeforeSeconds: {
      type: 'number',
      default: 0,
      min: 0,
      step: 0.1,
      description: 'Skip this many seconds into the clip',
      hiddenFromList: false,
    },
    // NOT named `playbackRate`: that name is reserved by Interactive for the surrounding
    // Sequence, which would retime the whole scene instead of just the clip.
    clipPlaybackRate: {
      type: 'number',
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.05,
      description: 'Clip speed',
      hiddenFromList: false,
    },
    keepClipAudio: {
      type: 'boolean',
      default: false,
      description: 'Keep the clip audio under the narration',
    },
  },
});
