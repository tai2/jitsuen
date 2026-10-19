import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const JA_FONT = 'NotoSansJP';

// Deliberately NOT top-level `await`. loadFont() takes a delayRender() handle before it
// fetches and releases it when the FontFace is registered (cancelRender() on failure), so
// Remotion already blocks the first frame until the font is ready — the await added nothing.
//
// It did break the render: bundle() from @remotion/bundler compiles with esbuild targeting
// chrome85, which has no top-level await, so `pnpm render` failed at bundle time while
// Studio and `remotion still` were fine. remotion.config.ts's setRspack(true) does not
// reach the Node APIs — the same trap that makes scripts/render.ts set every option itself.
//
// Bundled in public/ rather than fetched from Google Fonts so renders stay offline, and
// because an x86 Lambda image carries no CJK fonts at all.
void loadFont({
  family: JA_FONT,
  url: staticFile('fonts/NotoSansJP-Regular.woff2'),
  weight: '400',
});
void loadFont({
  family: JA_FONT,
  url: staticFile('fonts/NotoSansJP-Bold.woff2'),
  weight: '700',
});

export const JA_STACK = `"${JA_FONT}", "Hiragino Sans", sans-serif`;
