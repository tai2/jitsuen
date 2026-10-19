/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import {Config} from '@remotion/cli/config';

Config.setRspack(true);
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// Studio write-back / visual editing of scene instances.
Config.setInteractivityEnabled(true);

// Narration WAVs are requested from VOICEVOX at 48 kHz; keep the render there too so the
// mux is a straight pass-through rather than a surprise resample.
Config.setSampleRate(48000);

// Demo videos are screen-recording heavy — if the box goes OOM, this is the first dial.
// Config.setDisallowParallelEncoding(true);
