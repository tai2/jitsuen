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

const SEEDED = ['brief.md', 'storyboard.json', 'narration.json', 'tokens.css'];
const SEEDED_SCENES = ['opening.html', 'outro.html'];
/*
 * The root composition is seeded to the REPO ROOT, not into video/. HyperFrames requires
 * the entry composition to be index.html at the project root, and a composition cannot
 * reference anything above its project root — so src/ and assets/ have to be reachable
 * from it. It is gitignored like everything else about one video.
 */
const ROOT_SEEDED: [string, string][] = [['index.html', 'index.html']];
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

  await mkdir(join('video', 'scenes'), {recursive: true});
  for (const file of SEEDED_SCENES) {
    await copyFile(join('templates', 'scenes', file), join('video', 'scenes', file));
    console.log(`seeded   video/scenes/${file}`);
  }

  for (const [from, to] of ROOT_SEEDED) {
    await copyFile(join('templates', from), to);
    console.log(`seeded   ${to}`);
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
