# Scenes: how the motion graphics work

Most slides are **canvas scenes**: motion graphics drawn in code. A scene
explains a mechanism by *showing* it (an image splits into patches, a word
attends to the mugs, tokens fold 4 × 4 into one), with a few words on screen
instead of a paragraph.

## Anatomy

```
scenes/<name>.ts               export default defineScene({ cues, draw })
locales/scenes/<name>.yml      es: {…}  en: {…}
slides.md                      layout: scene · clicks: cues.length - 1 · <Scene name="<name>" />
```

- **`draw({ t, stage, L, K, ctx })` is a pure function of `t`** (seconds). It
  keeps no state, uses no timers and never calls `Math.random()`: use `hash()` or
  `rng(seed)` instead. The same `t` must always paint the same frame.
- **`cues`**: where the playhead rests. `cues[0]` ends the arrival animation,
  and `cues[k]` ends click *k*. `clicks:` must equal `cues.length - 1`, and
  `pnpm check:content` enforces it.
- **At rest nothing moves.** Every animation, punchlines included, must settle
  *before* its cue. Check the frame at each cue in the contact sheet.
- Draw in the **1920 × 1080 logical space**. Keep a 72 px margin. The bottom
  line holds the `K.cite()` source.
- **Strings come only from `L('key')`**, in both `es` and `en`. Numbers, code
  identifiers and symbols (`Δx`, `[CLS]`, `MLP`) may be literal.
- **Never pass `Infinity` into `seg()`**: `(t - ∞) / 0` is `NaN`, and a `NaN`
  alpha silently draws nothing. Use `1e9` for "never".

## Visual language

| Token | Use |
|---|---|
| `C.paper` | the world as pixels: the photo, input text, main type |
| `C.vis` (blue) | inside the model: patch tokens, embeddings, attention, projector |
| `C.gen` (gold) | what the model says: generated tokens, answers, accent words |
| `C.ok` / `C.warn` | success / failure only |
| `C.mute`, `C.dim` | labels, captions |

**Type**: `display` = Space Grotesk (titles, big numbers), `sans` = Instrument
Sans (sentences, 30–48 px), `mono` = Geist Mono (labels, token IDs). The
**minimum size is 22 px**.

**Words on screen**: a title of 8 words or fewer, labels, and at most one short
punchline per stage. The speaker notes carry the rest.

## Motion language

- Titles: `K.title(L('title'), t)`: words blur-rise, top-left.
- Punchlines: `K.punch(L('punch'), t, t0)`: `*accent*` words turn gold.
- Answers type on with `K.typeText(s, x, y, k)`. It wraps from the full string,
  so lines never re-wrap while the text is appearing.
- Arrivals: use `outExpo` for things that land and `outBack` for chips that pop.
  Counters use finite eases (`K.count`, `keys`), never springs.
- Content that swaps in one place uses two `presence()` windows that don't
  overlap.
- One bold move per scene: the strip opening up (patches), the grid clearing
  for zero-shot (clip), the 4 × 4 fold (token-budget).
- Banned: idle loops, glows, gradients on chrome, emoji, particles.

## The running example

`lib/scene/photo.ts` draws the photo in a 1000 × 1000 box and exports:

- `photoAt(K, x, y, s)`: the whole photo, clipped and rounded.
- `patch(K, i, j, n, x, y, w, h)`: patch (i, j) of an n × n grid.
- `cover(i, j, n, ['mug1', 'mug2'])`: how much of a patch the objects cover.
  Attention heatmaps use it, so they land on the mugs by construction.
- `thumb(K, kind, x, y, s)`: the small pictures for the CLIP slide.

## Honesty

Numbers come from `docs/RESEARCH.md` and are cited on screen. When a scene
*illustrates* rather than depicts, the cite line says so. That covers the
limits answers, the action numbers, and the heatmap as a stand-in for real
attention maps.

## Tooling

```sh
pnpm dev
open 'http://localhost:3030/#/lab'                    # scrubber, cue buttons, language
node scripts/sheet.mjs patches --lang en              # → .shots/scenes/patches.en.png
node scripts/sheet.mjs chapter --v bridge             # a variant of a shared scene
node scripts/sheet.mjs clip --times 5.8,9.2,13.4      # chosen instants
```

Look at the sheet in **both languages** before calling a scene done. Add
`?scene_t=3.2` to a deck URL to freeze every scene at that time.

Contrast of the palette on the navy ground (WCAG), as noted in `styles/tokens.css`:

```sh
node -e 'const L=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};const r=(a,b)=>((Math.max(L(a),L(b))+.05)/(Math.min(L(a),L(b))+.05)).toFixed(1);for(const h of ["#F5F8FF","#C3D0E6","#8FA3C2","#4DA3FF","#FFC857"])console.log(h,r(h,"#0B1426"))'
```

## Writing

Don't use em dashes in any on-screen text or speaker note. Use a comma, a
period, a colon or a connector word. `pnpm check:content` fails on them.
