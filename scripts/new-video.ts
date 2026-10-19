import {copyFile, mkdir, readdir, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

/**
 * Scaffold or reset video/ from templates/.
 *
 * video/ holds everything about ONE video — the brief, the storyboard, the narration
 * manifest, the theme tokens, the authored composition and the source media — and none of
 * it is tracked, because a brief and a narration script are usually the client's, not the
 * tool's. That also means nothing here is recoverable from git.
 *
 * So by default this replaces only the files templates/ owns and leaves the source media
 * alone, since those exist nowhere else. Pass --all to empty assets/ and reference/ too.
 *
 * A fresh clone has no video/ and will not compile until this has run once.
 */

const SEEDED = ['brief.md', 'storyboard.json', 'narration.json', 'tokens.ts', 'DemoVideo.tsx'];
const MEDIA_DIRS = ['assets', 'reference'];
const DERIVED = ['video/assets.json'];

const emptyDir = async (dir: string) => {
  const entries = await readdir(dir).catch(() => [] as string[]);
  let removed = 0;
  for (const entry of entries) {
    if (entry === '.gitkeep') continue;
    await rm(join(dir, entry), {recursive: true, force: true});
    removed++;
  }
  return removed;
};

const main = async () => {
  const all = process.argv.includes('--all');

  await mkdir('video', {recursive: true});
  for (const dir of MEDIA_DIRS) {
    await mkdir(join('video', dir), {recursive: true});
    await writeFile(join('video', dir, '.gitkeep'), '');
  }

  for (const file of SEEDED) {
    await copyFile(join('templates', file), join('video', file));
    console.log(`seeded   video/${file}`);
  }

  for (const derived of DERIVED) {
    await rm(derived, {force: true});
    console.log(`removed  ${derived}`);
  }

  if (all) {
    for (const dir of MEDIA_DIRS) {
      const n = await emptyDir(join('video', dir));
      console.log(`emptied  video/${dir}/ (${n} item${n === 1 ? '' : 's'})`);
    }
  } else {
    const counts = await Promise.all(
      MEDIA_DIRS.map(async (dir) =>
        (await readdir(join('video', dir)).catch(() => [])).filter((f) => f !== '.gitkeep').length,
      ),
    );
    const kept = counts.reduce((a, b) => a + b, 0);
    if (kept > 0) {
      console.log(`kept     ${kept} media file(s) — pass --all to remove them too`);
    }
  }

  console.log('\nvideo/ is ready. Put material in video/assets/, write video/brief.md, then run /demo-video.');
};

await main();
