import type {CalculateMetadataFunction} from 'remotion';
import storyboard from '../video/storyboard.json' with {type: 'json'};
import {buildTimeline, totalFrames, type SceneSpec, type SceneTiming} from './timeline.ts';

export type DemoVideoProps = {
  readonly scenes: SceneSpec[];
  readonly timeline?: SceneTiming[];
};

/**
 * calculateMetadata cannot call hooks, so it cannot read useVideoConfig(). It reads the
 * storyboard instead — the same single source the <Composition> registration uses, so the
 * two cannot drift apart.
 */
const {fps} = storyboard;

export const calculateDemoMetadata: CalculateMetadataFunction<DemoVideoProps> = ({props}) => {
  const timeline = buildTimeline(props.scenes, fps);
  return {
    durationInFrames: totalFrames(timeline),
    props: {...props, timeline},
    defaultOutName: 'demo',
  };
};
