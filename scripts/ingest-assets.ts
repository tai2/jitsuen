import {copyFile, mkdir, readdir, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ALL_FORMATS, FilePathSource, Input} from 'mediabunny';

const DIR = 'video/assets';
// Scene components reference assets as staticFile('assets/<file>'), which Remotion resolves
// inside public/. The human's material lives in video/assets/, so ingest mirrors it across;
// public/assets is generated and gitignored. Copied rather than symlinked so that bundle()
// sees real files no matter how it walks public/.
const PUBLIC_DIR = 'public/assets';
const VIDEO = new Set(['.mp4', '.mov', '.webm', '.mkv']);
const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

export type VideoAsset = {
  kind: 'video';
  path: string;
  durationInSeconds: number;
  width: number | null;
  height: number | null;
  hasAudio: boolean;
  warning: string | null;
};
export type ImageAsset = {kind: 'image'; path: string};
export type UnknownAsset = {kind: 'unknown'; path: string};
export type Asset = VideoAsset | ImageAsset | UnknownAsset;

const main = async () => {
  const files = (await readdir(DIR)).filter((f) => !f.startsWith('.'));
  const assets: Record<string, Asset> = {};

  // Rebuilt from scratch, so a file deleted from video/assets/ stops being renderable
  // instead of lingering in public/ and silently still working.
  await rm(PUBLIC_DIR, {recursive: true, force: true});
  await mkdir(PUBLIC_DIR, {recursive: true});

  for (const file of files) {
    const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
    const path = join(DIR, file);
    await copyFile(path, join(PUBLIC_DIR, file));

    if (VIDEO.has(ext)) {
      const input = new Input({formats: ALL_FORMATS, source: new FilePathSource(path)});
      try {
        const durationInSeconds = await input.computeDuration();
        const track = await input.getPrimaryVideoTrack();
        const audio = await input.getPrimaryAudioTrack();
        assets[file] = {
          kind: 'video',
          path,
          durationInSeconds,
          width: track?.displayWidth ?? null,
          height: track?.displayHeight ?? null,
          hasAudio: audio !== null,
          // WebM/MKV audio must decode sequentially from the start, which is hostile to
          // parallel/chunked renders.
          warning:
            ext === '.webm' || ext === '.mkv'
              ? 'remux to .mp4 before use: pnpm remotion ffmpeg -i <in> -c copy <out>.mp4'
              : null,
        };
      } finally {
        input.dispose();
      }
    } else if (IMAGE.has(ext)) {
      // Image dimensions are deliberately not probed: getImageDimensions() needs a DOM, and
      // ScreenshotScene sizes with objectFit: 'contain', so the numbers are never needed.
      assets[file] = {kind: 'image', path};
    } else {
      assets[file] = {kind: 'unknown', path};
    }
  }

  await writeFile('video/assets.json', JSON.stringify({assets}, null, 2) + '\n');
  console.log(
    `probed ${Object.keys(assets).length} assets → video/assets.json ` +
      `(mirrored to ${PUBLIC_DIR}/ for staticFile)`,
  );
};

await main();
