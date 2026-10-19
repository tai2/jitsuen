import {Track} from 'remotion';
import {OutroScene} from '../src/scenes/OutroScene.tsx';
import {TitleScene} from '../src/scenes/TitleScene.tsx';

/**
 * AUTHORED FILE — written by Claude Code, kept editable by hand.
 *
 * Every `from` and `durationInFrames` is a literal on purpose: Studio rewrites these when
 * you drag a scene, and the caption arrays when you edit a caption. A `.map()` over the
 * storyboard would be shorter and would kill all of that.
 *
 * The literals are not trusted blindly — `pnpm check` re-derives every one from
 * video/storyboard.json plus video/narration.json and fails with the corrected numbers.
 *
 * This is the starting sample: two silent scenes, no media. Replace it.
 */
export const DemoVideo = () => (
  <Track name="Scenes">
    <TitleScene
      name="opening"
      from={0}
      durationInFrames={90}
      title="タイトル"
      subtitle="サブタイトル"
    />
    <OutroScene name="outro" from={90} durationInFrames={60} message="おわり" url="example.com" />
  </Track>
);
