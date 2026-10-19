---
name: demo-video
description: Build a narrated Japanese demo video from video/brief.md and video/assets/ using HyperFrames + VOICEVOX
argument-hint: [optional extra direction, e.g. "60 seconds, focus on the editor"]
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(pnpm:*), Bash(hyperframes:*), Bash(scripts/voicevox-engine.sh:*), Bash(mise:*)
---

Build the demo video. Follow these stages **in order** and do not skip a validation gate.

**Tooling:** this project is pnpm-only, with versions pinned by `mise.toml`. Every command you run
is `pnpm <script>`. Never run `npm` or `npx`, and never `pnpm add` or `pnpm dlx` anything — the
dependency set is fixed and installing into it is not part of building a video. If a command
reports the wrong Node or pnpm version, run `mise install`; do not work around it.

## 1. Read the material
- `video/brief.md` — the human's intent. Treat it as the source of truth for *what to say*.
- `video/assets/` — list it. Then run `pnpm ingest` and read `video/assets.json` for
  real durations and dimensions. `pnpm ingest` also rebuilds `assets/`, which is the tree
  the renderer actually serves — so re-run it after adding material.
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

- **Nothing there?** Leave `video/tokens.css` alone. The default is deliberate, not a placeholder.
- **A reference image?** Open it and pull out: the background and whether it is light or
  dark, the text colour, the single strongest accent, how large the type runs relative to
  the frame, and how much empty space the design is comfortable with. Write those into
  `video/tokens.css` — the surface palettes, `--accent`, and the `--size-*` scale. Do not
  restyle `src/theme.css`; if a scene needs a colour the theme does not have, add the token
  rather than a literal.
- **Words only?** Same destination, your judgement for the values.

Two things to hold on to while matching:

- `--size-*` are given for a **1080px short edge** and scaled to the real frame, so they work
  in portrait and landscape alike. Check the longest real title and bullet against the
  usable width (`width − 2 × margin`) before settling on a display size — vertical video
  wants noticeably larger type than you would use in landscape.
- Captions deliberately ignore the surface. They are always a dark scrim with light text,
  because they sit over arbitrary footage.

Then look at a still before building the whole video on it:

```bash
pnpm exec hyperframes snapshot . --at 2.0 -o out/theme-check
```

`snapshot` screenshots the DOM. It does **not** run the FFmpeg frame extraction that
injects video frames, so every `<video>` reads as empty — it is the right tool for type,
colour and layout, and useless for checking footage. Only `pnpm render` shows footage.

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

## 6. Author the composition
Two files, both authored by hand, both gitignored:

- `/index.html` — the root composition: one scene host, one `<audio>` and one caption node
  per beat, each with **literal** `data-start` / `data-duration` in seconds.
- `video/scenes/<id>.html` — one `<template>` sub-composition per scene, holding that
  scene's markup and a call to its motion helper from `src/blocks/`.

Rules that will cost you a silent or truncated render if you miss them:

- **Every `<audio>` needs an `id`.** Without one the mixer skips it and the render comes out
  silent with no error anywhere. `pnpm check` greps for this specifically.
- **Every timeline ends with `tl.set({}, {}, <seconds>)`.** A composition's length is its
  GSAP timeline's length — there is no `data-duration` on a composition. A screencast scene
  has no tweens at all, so without this it collapses to zero.
- Register on `window.__timelines` under the composition's own `data-composition-id`, last,
  synchronously. The framework nests sub-compositions itself.
- Never loop over scenes to generate markup, and never hoist a timing literal into a
  variable — it breaks Studio write-back. See CLAUDE.md.
- Each scene host, narration element and caption node needs a stable `id` — that is how
  `pnpm check` finds them.

Run `pnpm check` until it passes, then `pnpm lint`.

## 7. Review
`pnpm studio` (`hyperframes preview`) and tell the human to look at it. Do not render until
they approve — a render is minutes, an audio re-synthesis is seconds.

`pnpm audit` (`hyperframes check`) is the automated half: lint, runtime errors, layout
occlusion, frozen motion and WCAG contrast in one pass. Run it before handing over.

Two different kinds of edit come back from Studio, and they are **not** fixed the same way:

- **Scene timing** persists into the authored file, so `pnpm check` will now fail. That is
  the human overriding you: update `video/storyboard.json`'s `padBefore` / `padAfter` /
  `minSeconds` to match their edit rather than reverting it.
- **Caption timing** does not persist that way — captions are derived from the measured
  narration. To change one, change the narration text and re-run `pnpm voice`.

If you nudge an element's position in Studio, switch auto-keyframe **off** first; left on,
it records a keyframe at the playhead instead of moving the element.

## 8. Render
`pnpm render`. Hand them `out/<project>.mp4` and point at
`out/<project>.credits.md` — the VOICEVOX character terms must be honoured in whatever
they publish.
