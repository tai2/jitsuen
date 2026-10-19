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
        │  CLAUDE CODE           authors video/DemoVideo.tsx with literal frame numbers
        ├─ pnpm check            re-derives every baked number, prints corrections
        ├─ pnpm studio           you review and nudge
        └─ pnpm render           out/<project>.mp4
```

## Setup

Requires [mise](https://mise.jdx.dev) and [VOICEVOX](https://voicevox.hiroshiba.jp).

```bash
mise trust && mise install          # pins node + pnpm
pnpm install --frozen-lockfile
pnpm new                            # scaffolds video/ from templates/
pnpm remotion browser ensure
```

`pnpm new` is not optional: `video/` is gitignored, and the build imports from it.

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
| `video/` | **one video — gitignored in full.** Brief, storyboard, narration manifest, theme tokens, authored composition, source media. |
| `out/` | renders. Gitignored. |

`video/` is gitignored because a brief and a narration script are usually the client's, not
the tool's. Keep per-video content out of `src/`.

## Design

`video/tokens.ts` is the only place the visual identity lives — palette, accent and type
scale. Put a reference image in `video/reference/`, say "match the reference" in the brief,
and the theme stage turns it into tokens before the storyboard is written.

Lengths are authored for a 1080px short edge and scaled to the real frame, so one scale
works in both portrait and landscape.

## Licensing

Remotion is free for individuals, non-profits and companies of three or fewer; an automated
pipeline otherwise needs a licence. Each VOICEVOX character has its own terms — `pnpm render`
archives them to `out/<project>.credits.md`, and the credit must appear wherever you publish.
