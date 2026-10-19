import type {CalculateMetadataFunction} from 'remotion';
import {buildTimeline, totalFrames, type SceneSpec, type SceneTiming} from './timeline.ts';

export type DemoVideoProps = {
  readonly scenes: SceneSpec[];
  readonly timeline?: SceneTiming[];
};

/** Must match the fps on the <Composition> registration — calculateMetadata has no hooks. */
const COMPOSITION_FPS = 30;

export const calculateDemoMetadata: CalculateMetadataFunction<DemoVideoProps> = ({props}) => {
  const timeline = buildTimeline(props.scenes, COMPOSITION_FPS);
  return {
    durationInFrames: totalFrames(timeline),
    props: {...props, timeline},
    defaultOutName: 'demo',
  };
};
