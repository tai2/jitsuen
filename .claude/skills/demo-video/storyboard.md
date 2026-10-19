# Authoring `video/storyboard.json`

The Zod contract is `scripts/lib/storyboard-schema.ts`. It is `.strict()` everywhere, so an
unrecognised key is an error, not a silently ignored field. `pnpm validate` prints the exact
path of anything wrong (`scenes.3.bullets`), so let it correct you rather than guessing.

## Top level

| Key | Notes |
|---|---|
| `project` | kebab-case. Names the output: `out/<project>.mp4`, `public/voiceover/<project>/`. |
| `fps` | 24, 30 or 60. Default 30. |
| `width` / `height` | Integers, **must be even** (h264/yuv420p). 1920×1080 is the norm. |
| `voice.styleId` | A *style* id, not a speaker id. `curl -s localhost:50021/speakers`. |
| `voice.speed` | 0.5–2.0. Prefer rewriting the line over changing this. |
| `voice.sampleRate` | 48000, fixed. |
| `readings` | Literal pre-substitutions, applied before synthesis. See the warning below. |
| `showCaptions` | Whether to emit `<BasicCaptions>` blocks. |
| `scenes` | At least one. |

## Look

The storyboard carries no design fields on purpose. Colour, type and spacing live in
`video/tokens.ts` and apply to every scene at once — see SKILL.md stage 3. The one visual choice
a scene makes for itself is `surface`, authored on the JSX node in `DemoVideo.tsx`:
`ink` (default, dark) or `paper` (light), useful when a run of light product screenshots
would otherwise fight a dark frame.

## Scene types

Every scene has `id` (kebab-case, unique), `narration` (string or `null` for a silent beat),
`padBefore`/`padAfter` (seconds of silence inside the scene, default 0.3 / 0.5),
`minSeconds` (floor, default 2 — and the *only* length source for a silent scene), and
optional `cues`.

| `type` | Extra keys |
|---|---|
| `title` | `title`, `subtitle?` |
| `screenshot` | `asset`, `caption?`, `focus?: {x, y, scale}` — `x`/`y` are %, `scale` 1–4 |
| `screencast` | `asset`, `trimBeforeSeconds`, `playbackRate`, `keepClipAudio` |
| `bullets` | `heading`, `bullets` (1–5 strings) |
| `outro` | `message`, `url?` |

Scene length is **audio-led**:
`max(padBefore + narrationLength + padAfter, minSeconds)`. You do not set the length; you set
the narration, and the length follows. That is why editing one word retimes the scene — and why
`pnpm check` exists.

`validate` also rejects a `screencast` whose clip is shorter than
`trimBeforeSeconds + minSeconds × playbackRate`, because that renders as a frozen tail.

## Writing the narration

- **One sentence per scene, 15–45 Japanese characters.** Longer reads as a wall of caption.
- **Spoken register, not written.** `できます` over `可能です`.
- **Full-width punctuation**: `、` and `。`. The normalizer converts ASCII anyway, but writing
  it correctly avoids surprises.
- **A `？` costs ~0.32 s**: the extra mora plus ~0.15 s of interrogative upspeak that is
  invisible in the query. Measured, not estimated.
- **Numerals are the most common wrong reading.** OpenJTalk guesses the counter. Put
  `"3分": "さんぷん"` in `readings`.
- **Never put a product name in ALL CAPS** in the narration field — the engine spells caps out
  letter by letter (`VOICE` → ブイオーアイシーイー).

### `readings` changes the CAPTION too

`readings` is a literal string substitution applied *before* synthesis, and captions are built
from the substituted text. So `{"DemoForge": "デモフォージ"}` makes the narrator say it right
**and** puts デモフォージ on screen where the viewer expected DemoForge.

Decide per name:
- Fine for acronyms you would read aloud anyway (`CLI` → シーエルアイ).
- Wrong for a brand you want shown in Latin script. For those, leave the narration text alone
  and register the pronunciation in the engine's user dictionary instead
  (`addUserDictWord` in `scripts/lib/voicevox.ts`) — but remember that dictionary is
  engine-global process state, shared with anything else using that engine.

### Captions are clause-aligned

One caption per spoken clause. VOICEVOX breathes at `、`, `。`, **and at spaces** — so
`DemoForge は、` is two clauses, not one. Short clauses give readable captions.

Caption *text* is your authored text; caption *timing* comes from the engine's per-mora
durations. If the clause count and the engine's breath-group count disagree, the pipeline
falls back to phonetic katakana for that line — visible, ugly, and a sign your punctuation and
the engine's phrasing have diverged.

### `cues`

`cues` marks moments to accent visually: `"cues": ["ダッシュボード"]` yields a frame number in
`narration.json`. Matching happens against the **phonetic mora stream**, where 長音 is spelled
as a vowel (ダッシュボード → ダッシュボオド). `ー` is expanded automatically, but 反映 → ハンエエ
is not something you can guess. If a cue does not match, `pnpm voice` prints a `!` warning with
the actual spoken moras — copy the substring from there.

## Worked example

```json
{
  "project": "demoforge",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "voice": {"styleId": 3, "speed": 1.0, "sampleRate": 48000},
  "readings": {"DemoForge": "デモフォージ", "CLI": "シーエルアイ", "3分": "さんぷん"},
  "showCaptions": true,
  "scenes": [
    {
      "id": "opening",
      "type": "title",
      "title": "DemoForge へようこそ",
      "subtitle": "3分でわかる使い方",
      "narration": "DemoForge は、製品デモ動画を自動で作るツールです。",
      "padBefore": 0.3,
      "padAfter": 0.6,
      "minSeconds": 3
    },
    {
      "id": "dashboard",
      "type": "screenshot",
      "asset": "dashboard.png",
      "caption": "ダッシュボードで全体を把握",
      "focus": {"x": 62, "y": 38, "scale": 1.18},
      "narration": "まずはダッシュボードです。進行中のプロジェクトがひと目で分かります。",
      "cues": ["ダッシュボード"]
    },
    {
      "id": "workflow",
      "type": "screencast",
      "asset": "workflow.mp4",
      "trimBeforeSeconds": 1.0,
      "playbackRate": 1.0,
      "keepClipAudio": false,
      "narration": "ここで素材を選ぶと、CLI が自動でナレーションを合成します。",
      "minSeconds": 4
    },
    {
      "id": "silent-beat",
      "type": "screenshot",
      "asset": "editor.png",
      "caption": "エディタで微調整",
      "narration": null,
      "minSeconds": 2
    },
    {
      "id": "outro",
      "type": "outro",
      "message": "さっそく試してみてください",
      "url": "example.com/demoforge",
      "narration": "詳しくは、こちらのサイトをご覧ください。",
      "padAfter": 1.0
    }
  ]
}
```
