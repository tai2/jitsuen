import {getSpeakers} from './lib/voicevox.ts';

const main = async () => {
  const speakers = await getSpeakers();
  const filter = process.argv[2]?.toLowerCase();
  const shown = filter
    ? speakers.filter((s) => s.name.toLowerCase().includes(filter))
    : speakers;

  for (const speaker of shown) {
    console.log(speaker.name);
    for (const style of speaker.styles) {
      console.log(`  ${String(style.id).padStart(4)}  ${style.name}${style.type ? ` (${style.type})` : ''}`);
    }
  }
  console.log(
    `\n${shown.length} character(s), ${shown.reduce((n, s) => n + s.styles.length, 0)} styles. ` +
      `Put the style id in storyboard.json as voice.styleId.\n` +
      `Each character has its own terms — pnpm render archives them to out/<project>.credits.md.`,
  );
};

await main();
