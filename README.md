# Del Píxel a la Palabra

An animated introduction to **Vision-Language Models (VLMs)** for the
Artificial Intelligence course at EAFIT: 10 to 15 minutes, with a MuJoCo demo.

Most slides are **motion-graphics scenes drawn in code**. A photo is cut into
patches, the patches become tokens, a projector turns them into "words" the
language model can read, and the answer comes out one token at a time. There
are few words on screen: the slides show the mechanism instead of describing
it. The deck is bilingual (Spanish / English, press `L`), dark navy for
projectors, runs fully offline and exports to PDF.

It is built on the scene engine and conventions of
[VLA-introduction-slides](https://github.com/Youngermaster/VLA-introduction-slides),
with a new visual identity and new content.

```bash
pnpm install
pnpm dev          # → http://localhost:3030
```

---

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server with hot reload |
| `pnpm build` | Static SPA into `dist/` (hash routing) |
| `pnpm export` / `pnpm export:en` | PDF into `export/`, the fallback if the projector fails |
| `pnpm verify` | TypeScript strict + the content drift guard |
| `pnpm check:content` | Locale parity, key resolution, scene click budgets, no em dashes |
| `pnpm check:fit` | Flags any HTML slide that overflows the canvas, in both languages (dev server must be running) |
| `node scripts/shots.mjs --lang es [--clicks]` | Screenshot every slide (dev server must be running) |
| `node scripts/sheet.mjs <scene> [--lang en] [--v see]` | Contact sheet of one canvas scene, every cue and midpoint |

The first time you run the screenshot scripts, Playwright may need its browser:
`pnpm exec playwright install chromium`.

> **Do not add `--per-slide` to the export.** It drops the click steps, so every
> build-up scene exports as its opening frame. The correct PDF has one page per
> click step (46 pages).

> **Frontmatter changes need a server restart.** Slidev's HMR does not reliably
> pick up `clicks:` or `layout:` edits. If a build-up stops advancing, restart
> `pnpm dev` before debugging anything else.

---

## Presenting

| Key | Action |
|---|---|
| → / ← | Next step / rewind the scene to the previous step |
| **L** | Switch the deck's language live (ES ⇄ EN) |
| **O** | Overview · **F** fullscreen · **D** draw |

Presenter mode with Spanish speaker notes per click: `http://localhost:3030/#/presenter`.

**Timing.** About 13 to 14 min of slides plus about 2.5 min of demo, so plan to
cut one or two slides for a 15-minute slot. Cut `token-budget` first, then
`bridges`, then `clip`'s third click. Never cut `patches`, `projector`, `answer`
or `vla-same`. The last one is the hinge between the two halves: it replays the
projector slide in the same place, so the room sees that a VLA is the same
machine with a different output.

**The live demo** (`demo-mujoco`) is a local Gradio app from
`~/personalProjects/vlm-arm-demo`, launched with `./run_demo.sh`
and run offline on the GPU (about 2.5 min). Qwen3-VL-4B answers questions about
an SO-101 arm's camera view in MuJoCo, then decides what to do (action
probabilities shown), boxes and measures objects with depth, and a classical
controller touches or picks and places them (a VLM plus a controller, not a VLA).
The timed script with the exact
prompts is in the slide's speaker notes; backup videos live in the demo's
`media/`. On stage, click once, `Alt+Tab` to the browser, then come back and
press →.

**Before the class:** run `pnpm export` and keep the PDF on a USB stick. Then
run `pnpm build && npx serve dist` with WiFi off and click through once.

---

## How it is built

```
slides.md                  deck structure, click budgets, speaker notes
scenes/<name>.ts           defineScene({ cues, draw }): one canvas scene
locales/scenes/<name>.yml  that scene's words, es and en side by side
locales/{es,en}.yml        text of the HTML slides (demo, thanks, references)
lib/scene/                 the engine: math (eases, springs), kit (text, chips,
                           arrows, typing), photo (the running example), robot (arm),
                           pipeline (the VLM diagram shared by projector and vla-same)
components/                Scene · QrCard · References · T · VideoSlot
layouts/                   scene · split · viz · claim
pages/lab.vue              /#/lab: scrub any scene, jump between cues
setup/                     i18n · /lab route · L shortcut · unocss palette
styles/                    tokens · base · slides · motion
scripts/                   check-content · check-types · check-fit · shots · sheet
docs/                      SCENES (style and motion rules) · RESEARCH (every number)
```

Each scene is a **pure function of time**: every click plays forward to the next
cue and stops, and ← rewinds. The PDF, the overview and the presenter preview
all show each step's finished frame. Style and motion rules are in
[docs/SCENES.md](docs/SCENES.md), and every number drawn on screen comes from
[docs/RESEARCH.md](docs/RESEARCH.md).

**The running example.** One photo, drawn in code (`lib/scene/photo.ts`): a table
with two mugs, an apple, a laptop and a plant. It carries the question *"how many
mugs are there?"* through the whole talk. Attention heatmaps are computed from
the objects' boxes (`cover()`), not hand-tuned.

## Design notes

- Deep navy `#0B1426` ground, white type.
- **Blue `#4DA3FF`**: *inside the model*. Patch tokens, embeddings, attention, the projector.
- **Gold `#FFC857`**: *what the model says*. Generated tokens, answers, accent words.
- The two accents are never swapped. They sit on the blue↔yellow axis, which
  survives deuteranopia, and they also separate on luminance.
- Structure comes from type scale, weight, colour and space, not from cards or
  hairlines, which vanish on a projector.
- Between keypresses nothing moves.
- Fonts are npm packages, not a CDN: Space Grotesk (display), Instrument Sans
  (text) and Geist Mono (labels).

## License

Apache-2.0.
