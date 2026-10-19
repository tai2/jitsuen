import {Composition, Folder} from 'remotion';
import storyboard from '../video/storyboard.json' with {type: 'json'};
import {DemoVideo} from '../video/DemoVideo.tsx';
import './fonts.ts';
import {calculateDemoMetadata} from './metadata.ts';
import {BulletsScene} from './scenes/BulletsScene.tsx';
import {OutroScene} from './scenes/OutroScene.tsx';
import {ScreencastScene} from './scenes/ScreencastScene.tsx';
import {ScreenshotScene} from './scenes/ScreenshotScene.tsx';
import {TitleScene} from './scenes/TitleScene.tsx';

/**
 * Dimensions, fps and the scene list all come from video/storyboard.json, which is the one
 * place they are written. They used to be hand-mirrored here, which meant an fps typo could
 * pass `pnpm check` — the timeline was built from the storyboard while the render used this
 * literal — and desync the whole video. Deriving them removes that failure entirely.
 *
 * `defaultProps` is deliberately NOT a literal here, unlike the scene compositions below.
 * Studio write-back only matters for values a human drags, and scene timing is dragged
 * through the literals in video/DemoVideo.tsx, not through this padding spec.
 */
/**
 * The storyboard is JSON, so TypeScript infers whatever keys the current file happens to
 * carry — and the optional padding keys are usually absent, because the Zod schema supplies
 * them. These defaults must therefore match scripts/lib/storyboard-schema.ts.
 */
type StoryboardScene = {
  id: string;
  padBefore?: number;
  padAfter?: number;
  minSeconds?: number;
};

const scenes = (storyboard.scenes as StoryboardScene[]).map((scene) => ({
  id: scene.id,
  padBefore: scene.padBefore ?? 0.3,
  padAfter: scene.padAfter ?? 0.5,
  minSeconds: scene.minSeconds ?? 2,
}));

export const RemotionRoot = () => (
  <>
    <Composition
      id="DemoVideo"
      component={DemoVideo}
      width={storyboard.width}
      height={storyboard.height}
      fps={storyboard.fps}
      durationInFrames={300}
      calculateMetadata={calculateDemoMetadata}
      defaultProps={{scenes}}
    />
    <Folder name="Scenes">
      <Composition
        id="TitleScene"
        component={TitleScene}
        width={storyboard.width}
        height={storyboard.height}
        fps={storyboard.fps}
        durationInFrames={90}
        defaultProps={{
          title: 'タイトル',
          subtitle: 'サブタイトル',
        }}
      />
      <Composition
        id="ScreenshotScene"
        component={ScreenshotScene}
        width={storyboard.width}
        height={storyboard.height}
        fps={storyboard.fps}
        durationInFrames={120}
        defaultProps={{
          asset: '',
          caption: 'キャプション',
          focusX: 50,
          focusY: 50,
          focusScale: 1.15,
        }}
      />
      <Composition
        id="ScreencastScene"
        component={ScreencastScene}
        width={storyboard.width}
        height={storyboard.height}
        fps={storyboard.fps}
        durationInFrames={120}
        defaultProps={{
          asset: '',
          trimBeforeSeconds: 0,
          clipPlaybackRate: 1,
          keepClipAudio: false,
        }}
      />
      <Composition
        id="BulletsScene"
        component={BulletsScene}
        width={storyboard.width}
        height={storyboard.height}
        fps={storyboard.fps}
        durationInFrames={120}
        defaultProps={{
          heading: '見出し',
          bullets: ['ひとつめ', 'ふたつめ', 'みっつめ'],
        }}
      />
      <Composition
        id="OutroScene"
        component={OutroScene}
        width={storyboard.width}
        height={storyboard.height}
        fps={storyboard.fps}
        durationInFrames={90}
        defaultProps={{
          message: 'おわり',
          url: 'example.com',
        }}
      />
    </Folder>
  </>
);
