import {copyFile, mkdir, readdir, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ALL_FORMATS, FilePathSource, Input} from 'mediabunny';

const DIR = 'video/assets';

/*
 * HyperFrames serves the PROJECT DIRECTORY (the repo root) over a static server and
 * resolves every path in a composition against /index.html. There is no staticFile() and
 * no bundler walking a public/ directory — a path is just a URL into the served tree.
 *
 * A composition cannot reference anything above the project root, so everything a render
 * touches has to live inside it. That is what assets/ is: one generated tree, rebuilt from
 * scratch on every ingest, holding the three kinds of file a render needs offline.
 */
const MEDIA_DIR = 'assets/media';
const FONTS_DIR = 'assets/fonts';
const VENDOR_DIR = 'assets/vendor';

/** Tracked tool assets, copied into the generated tree rather than referenced in place. */
const FONT_SOURCE = 'src/fonts';
const GSAP_SOURCE = 'node_modules/gsap/dist/gsap.min.js';

const VIDEO = new Set(['.mp4', '.mov', '.webm', '.mkv']);
const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

export type VideoAsset = {
  kind: 'video';
  path: string;
  durationInSeconds: number;
  width: number | null;
  height: number | null;
  hasAudio: boolean;
  /**
   * Recorded so a codec problem is visible in the manifest instead of being rediscovered
   * by eye. HEVC, ProRes and AV1 all decode fine in the render, but `hyperframes preview`
   * transcodes them to a cached authoring proxy first, which is slow the first time and
   * surprising if you do not know why.
   */
  codec: string | null;
  warning: string | null;
};
export type ImageAsset = {kind: 'image'; path: string};
export type UnknownAsset = {kind: 'unknown'; path: string};
export type Asset = VideoAsset | ImageAsset | UnknownAsset;

const main = async () => {
  const files = (await readdir(DIR)).filter((f) => !f.startsWith('.'));
  const assets: Record<string, Asset> = {};

  // Rebuilt from scratch, so a file deleted from video/assets/ stops being renderable
  // instead of lingering in the served tree and silently still working.
  await rm(MEDIA_DIR, {recursive: true, force: true});
  await mkdir(MEDIA_DIR, {recursive: true});

  for (const file of files) {
    const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
    const path = join(DIR, file);
    await copyFile(path, join(MEDIA_DIR, file));

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
          codec: track?.codec ?? null,
          // WebM/MKV audio must decode sequentially from the start, which is hostile to
          // the parallel workers a render uses.
          warning:
            ext === '.webm' || ext === '.mkv'
              ? 'remux to .mp4 before use: ffmpeg -i <in> -c copy <out>.mp4'
              : null,
        };
      } finally {
        input.dispose();
      }
    } else if (IMAGE.has(ext)) {
      // Image dimensions are deliberately not probed: the screenshot scene sizes with
      // object-fit: contain, so the numbers are never needed.
      assets[file] = {kind: 'image', path};
    } else {
      assets[file] = {kind: 'unknown', path};
    }
  }

  /*
   * Fonts are bundled rather than fetched from Google Fonts so renders stay offline, and
   * because a local @font-face is required: the lint rule `font_family_without_font_face`
   * is an error, and a family the renderer cannot supply falls back to a default face —
   * which for Japanese means tofu.
   */
  await rm(FONTS_DIR, {recursive: true, force: true});
  await mkdir(FONTS_DIR, {recursive: true});
  const fonts = (await readdir(FONT_SOURCE)).filter((f) => f.endsWith('.woff2'));
  for (const font of fonts) {
    await copyFile(join(FONT_SOURCE, font), join(FONTS_DIR, font));
  }

  /*
   * GSAP is vendored out of node_modules rather than loaded from jsDelivr. The canonical
   * HyperFrames example uses the CDN; this pipeline renders offline, and a lint run
   * confirmed a local <script src> raises nothing. Copying it here also pins the rendered
   * version to the one in pnpm-lock.yaml instead of whatever the CDN serves that day.
   */
  await rm(VENDOR_DIR, {recursive: true, force: true});
  await mkdir(VENDOR_DIR, {recursive: true});
  await copyFile(GSAP_SOURCE, join(VENDOR_DIR, 'gsap.min.js'));

  await writeFile('video/assets.json', JSON.stringify({assets}, null, 2) + '\n');
  console.log(
    `probed ${Object.keys(assets).length} assets → video/assets.json\n` +
      `  ${MEDIA_DIR}/   ${Object.keys(assets).length} file(s)\n` +
      `  ${FONTS_DIR}/   ${fonts.length} woff2\n` +
      `  ${VENDOR_DIR}/  gsap.min.js`,
  );
};

await main();
