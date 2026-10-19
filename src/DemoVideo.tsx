import {Audio} from '@remotion/media';
import {staticFile, Track, useVideoConfig} from 'remotion';
import {BasicCaptions} from './basic-captions.tsx';
import {BulletsScene} from './scenes/BulletsScene.tsx';
import {OutroScene} from './scenes/OutroScene.tsx';
import {ScreencastScene} from './scenes/ScreencastScene.tsx';
import {ScreenshotScene} from './scenes/ScreenshotScene.tsx';
import {TitleScene} from './scenes/TitleScene.tsx';

/**
 * AUTHORED FILE — written by Claude Code, kept editable by hand.
 *
 * Every `from` and `durationInFrames` below is a literal on purpose: Remotion Studio
 * rewrites these literals when you drag a scene, and the caption arrays when you edit a
 * caption. A `.map()` over the storyboard would be shorter and would kill all of that.
 *
 * The literals are not trusted blindly — `pnpm check` re-derives every one of them from
 * input/storyboard.json plus src/generated/narration.json and fails with the corrected
 * numbers if they have gone stale.
 */
export const DemoVideo = () => {
  const {fps} = useVideoConfig();

  return (
    <>
      <Track name="Scenes">
      <TitleScene
        name="opening"
        from={0}
        durationInFrames={181}
        title={"DemoForge へようこそ"}
        subtitle={"3分でわかる使い方"}
      />
      <ScreenshotScene
        name="dashboard"
        from={181}
        durationInFrames={173}
        asset={"dashboard.png"}
        caption={"ダッシュボードで全体を把握"}
        focusX={62}
        focusY={38}
        focusScale={1.18}
      />
      <ScreencastScene
        name="workflow"
        from={354}
        durationInFrames={201}
        asset={"workflow.mp4"}
        trimBeforeSeconds={1}
        clipPlaybackRate={1}
        keepClipAudio={false}
      />
      <BulletsScene
        name="features"
        from={555}
        durationInFrames={160}
        heading={"できること"}
        bullets={["台本の自動生成", "日本語ナレーション合成", "字幕の自動付与"]}
      />
      <ScreencastScene
        name="mobile"
        from={715}
        durationInFrames={136}
        asset={"mobile.mp4"}
        trimBeforeSeconds={0.5}
        clipPlaybackRate={1}
        keepClipAudio={false}
      />
      <ScreenshotScene
        name="silent-beat"
        from={851}
        durationInFrames={60}
        asset={"editor.png"}
        caption={"エディタで微調整"}
        focusX={50}
        focusY={50}
        focusScale={1}
      />
      <OutroScene
        name="outro"
        from={911}
        durationInFrames={137}
        message={"さっそく試してみてください"}
        url={"example.com/demoforge"}
      />
      </Track>
      <Track name="Narration">
      <Audio
        name={"opening narration"}
        src={staticFile("voiceover/demoforge/opening.wav")}
        from={9}
        premountFor={2 * fps}
        disallowFallbackToHtml5Audio
      />
      <Audio
        name={"dashboard narration"}
        src={staticFile("voiceover/demoforge/dashboard.wav")}
        from={190}
        premountFor={2 * fps}
        disallowFallbackToHtml5Audio
      />
      <Audio
        name={"workflow narration"}
        src={staticFile("voiceover/demoforge/workflow.wav")}
        from={363}
        premountFor={2 * fps}
        disallowFallbackToHtml5Audio
      />
      <Audio
        name={"features narration"}
        src={staticFile("voiceover/demoforge/features.wav")}
        from={564}
        premountFor={2 * fps}
        disallowFallbackToHtml5Audio
      />
      <Audio
        name={"mobile narration"}
        src={staticFile("voiceover/demoforge/mobile.wav")}
        from={724}
        premountFor={2 * fps}
        disallowFallbackToHtml5Audio
      />
      <Audio
        name={"outro narration"}
        src={staticFile("voiceover/demoforge/outro.wav")}
        from={920}
        premountFor={2 * fps}
        disallowFallbackToHtml5Audio
      />
      </Track>
      <Track name="Captions">
      <BasicCaptions
        name={"opening captions"}
        from={9}
        durationInFrames={154}
        width={1400}
        style={{position: 'absolute', bottom: 120, left: 260}}
        captions={[
          {text: "デモフォージ", startMs: 0, endMs: 826, timestampMs: 413, confidence: null, pageBreakAfter: true},
          {text: "は、", startMs: 1325, endMs: 1615, timestampMs: 1470, confidence: null, pageBreakAfter: true},
          {text: "製品デモ動画を自動で作るツールです。", startMs: 2030, endMs: 5096, timestampMs: 3563, confidence: null, pageBreakAfter: true},
        ]}
      />
      <BasicCaptions
        name={"dashboard captions"}
        from={190}
        durationInFrames={150}
        width={1400}
        style={{position: 'absolute', bottom: 120, left: 260}}
        captions={[
          {text: "まずはダッシュボードです。", startMs: 0, endMs: 1556, timestampMs: 778, confidence: null, pageBreakAfter: true},
          {text: "進行中のプロジェクトがひと目で分かります。", startMs: 1870, endMs: 4994, timestampMs: 3432, confidence: null, pageBreakAfter: true},
        ]}
      />
      <BasicCaptions
        name={"workflow captions"}
        from={363}
        durationInFrames={178}
        width={1400}
        style={{position: 'absolute', bottom: 120, left: 260}}
        captions={[
          {text: "ここで素材を選ぶと、", startMs: 0, endMs: 1603, timestampMs: 802, confidence: null, pageBreakAfter: true},
          {text: "シーエルアイ", startMs: 1939, endMs: 2862, timestampMs: 2401, confidence: null, pageBreakAfter: true},
          {text: "が自動でナレーションを合成します。", startMs: 3366, endMs: 5878, timestampMs: 4622, confidence: null, pageBreakAfter: true},
        ]}
      />
      <BasicCaptions
        name={"features captions"}
        from={564}
        durationInFrames={136}
        width={1400}
        style={{position: 'absolute', bottom: 120, left: 260}}
        captions={[
          {text: "台本の生成から字幕付けまで、", startMs: 0, endMs: 2562, timestampMs: 1281, confidence: null, pageBreakAfter: true},
          {text: "ぜんぶ自動でできます。", startMs: 2926, endMs: 4516, timestampMs: 3721, confidence: null, pageBreakAfter: true},
        ]}
      />
      <BasicCaptions
        name={"mobile captions"}
        from={724}
        durationInFrames={113}
        width={1400}
        style={{position: 'absolute', bottom: 120, left: 260}}
        captions={[
          {text: "もちろん、", startMs: 0, endMs: 608, timestampMs: 304, confidence: null, pageBreakAfter: true},
          {text: "縦型のショート動画にも書き出せます。", startMs: 1049, endMs: 3737, timestampMs: 2393, confidence: null, pageBreakAfter: true},
        ]}
      />
      <BasicCaptions
        name={"outro captions"}
        from={920}
        durationInFrames={98}
        width={1400}
        style={{position: 'absolute', bottom: 120, left: 260}}
        captions={[
          {text: "詳しくは、", startMs: 0, endMs: 842, timestampMs: 421, confidence: null, pageBreakAfter: true},
          {text: "こちらのサイトをご覧ください。", startMs: 1143, endMs: 3275, timestampMs: 2209, confidence: null, pageBreakAfter: true},
        ]}
      />
      </Track>
    </>
  );
};
