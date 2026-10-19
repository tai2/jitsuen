import {mkdir, copyFile, readdir, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

/**
 * Rebuild input/ from templates/.
 *
 * input/ is gitignored, so nothing in it is recoverable from git. By default this removes
 * only the AUTHORED and DERIVED artifacts — the brief, the storyboard, the probe output —
 * and leaves the source media alone, because those files exist nowhere else. Pass --all to
 * empty input/assets/ and input/reference/ too.
 */

const ARTIFACTS = ['input/storyboard.json', 'input/assets.json'];
const MEDIA_DIRS = ['input/assets', 'input/reference'];

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

  for (const dir of MEDIA_DIRS) {
    await mkdir(dir, {recursive: true});
    await writeFile(join(dir, '.gitkeep'), '');
  }

  for (const artifact of ARTIFACTS) {
    await rm(artifact, {force: true});
    console.log(`removed  ${artifact}`);
  }

  await copyFile('templates/brief.md', 'input/brief.md');
  console.log('reset    input/brief.md (from templates/brief.md)');

  if (all) {
    for (const dir of MEDIA_DIRS) {
      const n = await emptyDir(dir);
      console.log(`emptied  ${dir}/ (${n} item${n === 1 ? '' : 's'})`);
    }
  } else {
    const counts = await Promise.all(
      MEDIA_DIRS.map(async (dir) => (await readdir(dir).catch(() => [])).filter((f) => f !== '.gitkeep').length),
    );
    const kept = counts.reduce((a, b) => a + b, 0);
    if (kept > 0) {
      console.log(`kept     ${kept} file(s) in ${MEDIA_DIRS.join('/ and ')}/ — pass --all to remove them too`);
    }
  }

  console.log(
    '\ninput/ is reset. Note the previous video still lives in src/DemoVideo.tsx and\n' +
      'src/generated/narration.json, which are tracked — clear those too if the script was\n' +
      'confidential.',
  );
};

await main();
