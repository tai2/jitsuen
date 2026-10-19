---
name: demo-video
description: Build a narrated Japanese demo video from video/brief.md and video/assets/ using Remotion + VOICEVOX
argument-hint: [optional extra direction, e.g. "60 seconds, focus on the editor"]
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(pnpm:*), Bash(scripts/voicevox-engine.sh:*), Bash(mise:*)
---

Build the demo video. Follow these stages **in order** and do not skip a validation gate.

**Tooling:** this project is pnpm-only, with versions pinned by `mise.toml`. Every command you run
is `pnpm <script>`. Never run `npm` or `npx`, and never `pnpm add` or `pnpm dlx` anything — the
dependency set is fixed and installing into it is not part of building a video. If a command
reports the wrong Node or pnpm version, run `mise install`; do not work around it.

## 1. Read the material
- `video/brief.md` — the human's intent. Treat it as the source of truth for *what to say*.
- `video/assets/` — list it. Then run `pnpm ingest` and read `video/assets.json` for
  real durations and dimensions. `pnpm ingest` also mirrors the files into `public/assets/`,
  which is where `staticFile()` reads them from — so re-run it after adding material.
- `video/reference/` — if it holds anything, **look at the images**. They are the human's
  visual reference, and stage 3 turns them into tokens.
- `video/narration.json`, if present — the previous run. Reuse unchanged lines.

## 2. Start the engine
`pnpm engine`. It is idempotent; it prints the engine version when ready.
Pick a voice: `pnpm voices` lists every character and style id (`pnpm voices ずんだ` to
filter). Default to ずんだもん ノーマル (styleId 3) unless the brief implies otherwise.

Check that character's terms before committing to it — each one differs, and `pnpm render`
archives them to `out/<project>.credits.md` only *after* the video exists.

## 3. Set the theme

Read the brief's "Look and feel" section and anything in `video/reference/`.

- **Nothing there?** Leave `video/tokens.ts` alone. The default is deliberate, not a placeholder.
- **A reference image?** Open it and pull out: the background and whether it is light or
  dark, the text colour, the single strongest accent, how large the type runs relative to
  the frame, and how much empty space the design is comfortable with. Write those into
  `video/tokens.ts` — `surfaces`, `accent`, and `sizes`. Do not restyle the scene components;
  if a scene needs a colour the theme does not have, add the token rather than a literal.
- **Words only?** Same destination, your judgement for the values.

Two things to hold on to while matching:

- `sizes` are given for a **1080px short edge** and scaled to the real frame, so they work
  in portrait and landscape alike. Check the longest real title and bullet against the
  usable width (`width − 2 × margin`) before settling on a display size — vertical video
  wants noticeably larger type than you would use in landscape.
- Captions deliberately ignore the surface. They are always a dark scrim with light text,
  because they sit over arbitrary footage.

Then render one still to look at it — `pnpm remotion still DemoVideo out/theme-check.png
--frame=60` — before building the whole video on it.

## 4. Author video/storyboard.json
Follow `storyboard.md` in this skill folder for the schema and the writing rules.
Key judgement calls that are YOURS, not the script's:
- scene count and order (aim for 6–12 scenes for a 2–3 minute video),
- which asset belongs to which beat,
- the Japanese narration text for each scene — spoken register, not written register,
- `readings` for every product name and acronym in the script,
- `focus`/`trimBeforeSeconds` so the right part of each asset is on screen.

Then run `pnpm validate`. **Fix every error it reports before continuing.**

## 5. Synthesize
`pnpm voice`. Read the printed durations. If a line came out much longer or shorter
than the beat needs, edit the text (not `speed`) and re-run — it only
re-synthesizes changed lines. Read any `!` warnings: an unmatched `cues` entry prints the
actual spoken moras to copy from.

## 6. Author video/DemoVideo.tsx
Write one authored JSX block per scene, with timing as **literal numbers** taken from
`pnpm check`'s output. Paste caption arrays inline from `video/narration.json`.
Never write a `.map()` over scenes, never hoist `defaultProps` or `interpolate()` into a
variable — it breaks Studio write-back. See CLAUDE.md.

Each scene node must carry `name="<scene id>"` — that is how `pnpm check` finds it.

Run `pnpm check` until it passes, then `pnpm lint`.

## 7. Review
`pnpm studio` and tell the human to look at it. Do not render until they approve —
a render is minutes, an audio re-synthesis is seconds.

If they edited scene timing in Studio, `pnpm check` will now fail: that is the human
overriding you. Update `video/storyboard.json`'s `padBefore`/`padAfter`/`minSeconds` to
match their edit rather than reverting their change.

## 8. Render
`pnpm render`. Hand them `out/<project>.mp4` and point at
`out/<project>.credits.md` — the VOICEVOX character terms must be honoured in whatever
they publish.
