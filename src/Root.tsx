import {Composition, Folder} from 'remotion';
import './fonts.ts';
import {DemoVideo} from './DemoVideo.tsx';
import {calculateDemoMetadata} from './metadata.ts';
import {BulletsScene} from './scenes/BulletsScene.tsx';
import {OutroScene} from './scenes/OutroScene.tsx';
import {ScreencastScene} from './scenes/ScreencastScene.tsx';
import {ScreenshotScene} from './scenes/ScreenshotScene.tsx';
import {TitleScene} from './scenes/TitleScene.tsx';

/**
 * Connected compositions: the real video, plus every scene type registered on its own so
 * each gets an independently editable Studio timeline.
 *
 * Every `defaultProps` below is an inline object literal — not a variable, not spread, not
 * `satisfies`-wrapped — because Studio can only write back into a literal.
 */
export const RemotionRoot = () => (
  <>
    <Composition
      id="DemoVideo"
      component={DemoVideo}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={300}
      calculateMetadata={calculateDemoMetadata}
      defaultProps={{
        scenes: [
          {id: 'opening', padBefore: 0.3, padAfter: 0.6, minSeconds: 3},
          {id: 'dashboard', padBefore: 0.3, padAfter: 0.5, minSeconds: 2},
          {id: 'workflow', padBefore: 0.3, padAfter: 0.5, minSeconds: 4},
          {id: 'features', padBefore: 0.3, padAfter: 0.5, minSeconds: 2},
          {id: 'mobile', padBefore: 0.3, padAfter: 0.5, minSeconds: 3},
          {id: 'silent-beat', padBefore: 0.3, padAfter: 0.5, minSeconds: 2},
          {id: 'outro', padBefore: 0.3, padAfter: 1, minSeconds: 2},
        ],
      }}
    />
    <Folder name="Scenes">
      <Composition
        id="TitleScene"
        component={TitleScene}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={90}
        defaultProps={{
          title: 'DemoForge へようこそ',
          subtitle: '3分でわかる使い方',
        }}
      />
      <Composition
        id="ScreenshotScene"
        component={ScreenshotScene}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={120}
        defaultProps={{
          asset: 'dashboard.png',
          caption: 'ダッシュボードで全体を把握',
          focusX: 62,
          focusY: 38,
          focusScale: 1.18,
        }}
      />
      <Composition
        id="ScreencastScene"
        component={ScreencastScene}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={120}
        defaultProps={{
          asset: 'workflow.mp4',
          trimBeforeSeconds: 1,
          clipPlaybackRate: 1,
          keepClipAudio: false,
        }}
      />
      <Composition
        id="BulletsScene"
        component={BulletsScene}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={120}
        defaultProps={{
          heading: 'できること',
          bullets: ['台本の自動生成', '日本語ナレーション合成', '字幕の自動付与'],
        }}
      />
      <Composition
        id="OutroScene"
        component={OutroScene}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={90}
        defaultProps={{
          message: 'さっそく試してみてください',
          url: 'example.com/demoforge',
        }}
      />
    </Folder>
  </>
);
