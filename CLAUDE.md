# jitsuen

実演 — a narrated product demo, built by Claude Code from a brief and a folder of
screenshots and screen recordings.

Remotion 4.0.536 + VOICEVOX 0.25.2. `research.md` has the full study; `plan.md` the design and
the implementation checklist. `.claude/skills/demo-video/` drives a build.

Claude Code is the planner and author; every mechanical step is a deterministic script.
`pnpm ingest` → *you author the storyboard* → `pnpm validate` → `pnpm voice` →
*you author `video/DemoVideo.tsx`* → `pnpm check` → `pnpm lint` → `pnpm studio` → `pnpm render`.

## Layout

`src/` and `scripts/` are the TOOL and are tracked. `video/` is ONE video — brief,
storyboard, narration manifest, theme tokens, authored composition, source media — and is
gitignored in full, because a brief and a narration script are usually the client's. A fresh
clone has no `video/` and will not compile until `pnpm new` seeds it from `templates/`.

## Never

- Never call an Anthropic API. Claude Code *is* the planner; scripts are deterministic.
- Never run `npm` or `npx`. This project is pnpm-only; versions come from `mise.toml`.
- Never `pnpm add` a `@remotion/*` package — use `pnpm remotion add <pkg>` (version lockstep).
- Never rely on a transitive dependency. pnpm does not hoist; `import` it only if it is in
  `package.json`.
- Never bump `node` or `pnpm` outside `mise.toml`, and never add `shamefully-hoist`.
- Never put pnpm settings in `package.json`'s `pnpm` field — pnpm 11 ignores it with a warning.
  They live in `pnpm-workspace.yaml`.
- Never use top-level `await` anywhere under `src/`. `bundle()` compiles with esbuild targeting
  chrome85 and will fail the render, while Studio (rspack) succeeds — so it breaks late.
- Never use `Math.random()`, `Date.now()`, CSS `transition`/`animation`, or `setInterval`
  in `src/`. Remotion renders in parallel tabs that share no state.
- Never hoist `defaultProps`, `interpolate()` results, or caption arrays into variables —
  Studio write-back needs inline literals on the JSX node.
- Never generate scene JSX with `.map()`. One authored node per scene.
- Never measure audio inside a component. `calculateMetadata` runs once; components run
  once per frame per tab.
- Never retry a VOICEVOX HTTP 500 — it means the text broke the phoneme analyzer. Fix the text.
  On 0.25.2 the likelier failure is the opposite: unreadable text returns **zero accent
  phrases** and would synthesize silence, so `synthesize.ts` throws on that instead.
- Never name a scene prop `playbackRate`, `trimBefore`, `from`, `durationInFrames` or `name` —
  `Interactive` reserves them for the surrounding Sequence.
- Never hardcode a colour, font size or margin in a scene component. Values come from
  `video/tokens.ts`, mechanism from `src/theme.ts`; if a token is missing, add it. A literal
  hex in a scene is a value the next reference-match will silently fail to change.
- Never put per-video content under `src/`. If it describes one video rather than the tool,
  it belongs in `video/`, which is gitignored. This is how a client's narration script ends
  up in a public repo.

## Always

- `trimBefore` does not delay audio. Use `from`.
- Derive frames from `useVideoConfig().fps` inline, never a module-level FPS constant.
  The one exception is `src/metadata.ts`, which cannot call hooks and so reads
  `video/storyboard.json` — the same single source `src/Root.tsx` registers from.
- `video/storyboard.json` is the only place `width`, `height` and `fps` are written.
  `src/Root.tsx` derives the `<Composition>` from it. Never reintroduce a mirrored literal.
- Round each timeline boundary from a running total of seconds. Never sum per-scene
  `Math.ceil` — measured at 27 frames (0.9 s) of drift over a 5-minute video.
- Give every scene node `name="<scene id>"`. `pnpm check` finds it by that and nothing else.
- `video/narration.json` is the timing lockfile for the current video. It is NOT tracked.
- `mise.toml` and `pnpm-lock.yaml` are tracked too. Commit lockfile changes separately.
- `public/assets/` and `public/voiceover/` are generated. Re-run `pnpm ingest` after adding
  material; never edit them by hand.
- Changing the default look for FUTURE videos means editing `templates/tokens.ts`;
  `video/tokens.ts` only affects the video in front of you.
- Theme lengths are authored for a 1080px short edge and scaled by `useMetrics()`. Check the
  longest real string against `width − 2 × margin` before raising the type scale.
- `remotion.config.ts` does NOT apply to the Node APIs in `scripts/render.ts`. Any option that
  matters there must be passed explicitly to `renderMedia()`.
- `pnpm validate` → `pnpm voice` → `pnpm check` → `pnpm lint`, in that order.
