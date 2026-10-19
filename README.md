# jitsuen

実演 — a narrated Japanese product demo, built by Claude Code from a brief and a folder of
screenshots and screen recordings.

Claude Code is the planner and author; every mechanical step is a deterministic script.
Nothing calls an LLM API — the judgement happens in-session, and the scripts validate it.

```
video/brief.md + video/assets/   you write the brief, you drop in the material
        │
        ├─ pnpm ingest           probe durations, dimensions, audio
        │  CLAUDE CODE           sets the theme, authors the storyboard
        ├─ pnpm validate         Zod + asset checks, exits non-zero with exact paths
        ├─ pnpm voice            VOICEVOX synthesis, content-hash cached
        │  CLAUDE CODE           authors index.html + video/scenes/*.html, literal times
        ├─ pnpm check            re-derives every baked number, prints corrections
        ├─ pnpm studio           you review and nudge (hyperframes preview)
        └─ pnpm render           out/<project>.mp4
```

## Setup

Requires [mise](https://mise.jdx.dev) and [VOICEVOX](https://voicevox.hiroshiba.jp).

```bash
mise trust && mise install          # pins node + pnpm + ffmpeg
pnpm install --frozen-lockfile
pnpm new                            # scaffolds index.html + video/ from templates/
pnpm browser                        # fetch the Chrome the renderer drives
```

FFmpeg and ffprobe are hard requirements — the renderer shells out to them for source-frame
extraction and media probing. `mise install` provides them; `pnpm exec hyperframes doctor`
checks the whole environment at once.

`pnpm new` is not optional: `/index.html` and `video/` are both gitignored, and there is
nothing to render without them.

## Making a video

```bash
pnpm engine                         # start VOICEVOX (idempotent)
# put screenshots and clips in video/assets/
# write video/brief.md, including the "Look and feel" section
```

Then run `/demo-video` in Claude Code and follow it through to `pnpm render`.

## Layout

| Path | |
|---|---|
| `src/`, `scripts/` | the tool. Tracked. |
| `templates/` | the starting point for a new video. Tracked. |
| `index.html` | **the authored root composition — gitignored.** At the repo root because the renderer requires the entry to be `index.html` at the project root. |
| `video/` | **one video — gitignored in full.** Brief, storyboard, narration manifest, theme tokens, the authored scene sub-compositions, source media. |
| `assets/` | generated serving tree — media, voiceover, fonts, vendored GSAP. Gitignored. |
| `out/` | renders. Gitignored. |

`video/` is gitignored because a brief and a narration script are usually the client's, not
the tool's. Keep per-video content out of `src/`.

## Design

`video/tokens.css` is the only place the visual identity lives — palette, accent and type
scale. Put a reference image in `video/reference/`, say "match the reference" in the brief,
and the theme stage turns it into tokens before the storyboard is written.

Lengths are authored for a 1080px short edge and scaled to the real frame, so one scale
works in both portrait and landscape.

## Licensing

**HyperFrames is Apache-2.0** — no headcount clause, no licence to buy, commercial and
internal use alike. (This project previously used Remotion, which is source-available and
requires a paid Company License at a combined headcount of four or more, counting everyone
regardless of whether they touch the tool.)

**GSAP** is used under its Standard License, which is free for commercial use including the
formerly members-only plugins. Its one prohibition is use "in tools that allow users to
build visual animations without code" — `jitsuen` is a code-authored internal pipeline that
is never distributed to end users as an animation builder, so that clause does not apply.

**VOICEVOX** is unchanged and is the obligation that actually travels with the output: each
character has its own terms, `pnpm render` archives them to `out/<project>.credits.md`, and
the credit must appear wherever you publish.
