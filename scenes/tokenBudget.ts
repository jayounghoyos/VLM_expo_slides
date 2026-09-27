/**
 * How many tokens does an image cost?
 *
 *   arrive  224 px → a 14 × 14 grid: 196 tokens (ViT)
 *   1       336 px → 24 × 24: 576 (LLaVA-1.5)
 *   2       672 px → 48 × 48: 2 304. More resolution, 4× the tokens.
 *   3       pixel shuffle: every 4 × 4 block of tokens folds into one,
 *           2 304 → 144 (SmolVLM, r = 4). The one bold move: the merge.
 */
import { defineScene } from '../lib/scene/types'
import { C } from '../lib/scene/kit'
import { alpha, hash, keys, lerp, outBack, outCubic, presence, seg } from '../lib/scene/math'

const GX = 150
const GY = 270
const GS = 600
const STAGES = [
  { n: 14, t0: 0.5 },
  { n: 24, t0: 2.6 },
  { n: 48, t0: 5.8 },
] as const
const SHUF = { t0: 9.3, t1: 10.9 }

export default defineScene({
  cues: [2.2, 5.4, 8.8, 12.6],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)

    // ── the grids: each one waves in, then waves out for the next ───────
    STAGES.forEach((st, si) => {
      const next = STAGES[si + 1]
      const outAt = next ? next.t0 - 0.2 : 1e9 // finite: seg() over Infinity is NaN
      const n = st.n
      const c = GS / n
      const gap = Math.max(1.5, c * 0.14)
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const d = ((i + j) / (2 * n)) * 0.9
          const kin = outBack(seg(t, st.t0 + d, st.t0 + d + 0.35))
          const kout = outCubic(seg(t, outAt + d * 0.4, outAt + d * 0.4 + 0.2))
          if (kin <= 0 || kout >= 1) continue
          let x = GX + i * c + gap / 2
          let y = GY + j * c + gap / 2
          let w = c - gap
          // 3. the last grid folds 4 × 4 → 1
          if (si === 2) {
            const m = outCubic(seg(t, SHUF.t0 + (Math.floor(i / 4) + Math.floor(j / 4)) * 0.03, SHUF.t1))
            const B = GS / 12
            const bx = GX + Math.floor(i / 4) * B + 4
            const by = GY + Math.floor(j / 4) * B + 4
            x = lerp(x, bx, m)
            y = lerp(y, by, m)
            w = lerp(w, B - 8, m)
          }
          const s = 0.5 + 0.5 * kin
          ctx.fillStyle = alpha(C.vis, (0.55 + 0.4 * hash(i, j + n)) * (1 - kout))
          ctx.fillRect(x + (w - w * s) / 2, y + (w - w * s) / 2, w * s, w * s)
        }
      }
    })
    // after the fold, the big tokens get a crisp edge
    const edge = outCubic(seg(t, SHUF.t1 - 0.2, SHUF.t1 + 0.3))
    if (edge > 0) {
      const B = GS / 12
      for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) K.strokeRR(GX + i * B + 4, GY + j * B + 4, B - 8, B - 8, 4, alpha(C.paper, 0.5 * edge), 2)
    }

    // the image size above the grid
    const px = ['224 px', '336 px', '672 px', '672 px']
    const pt = [0.5, 2.6, 5.8, 1e9]
    px.slice(0, 3).forEach((s, i) => K.label(s, GX, GY - 22, { alpha: presence(t, pt[i], pt[i + 1] - 0.2), color: C.dim, size: 26 }))

    // ── the counter ───────────────────────────────────────────────────
    const v = keys(t, [[0.5, 0], [1.6, 196], [2.6, 196], [3.8, 576], [5.8, 576], [7.2, 2304], [SHUF.t0, 2304], [SHUF.t1, 144]])
    const CX = GX + GS + 110
    const ck = outCubic(seg(t, 0.6, 1.0))
    K.text(Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, L('sep')), CX, GY + 170, { size: 170, weight: 700, fam: 'display', color: C.vis, alpha: ck })
    K.text(L('tokens'), CX + 6, GY + 230, { size: 32, weight: 600, fam: 'sans', color: C.paper, alpha: ck })

    const notes: [string, number, number][] = [['n0', 0.9, 2.4], ['n1', 3.6, 5.6], ['n2', 6.8, 9.1], ['n3', 10.6, 1e9]]
    notes.forEach(([k, a, b]) => {
      const p = presence(t, a, b)
      if (p <= 0) return
      K.text(L(k), CX + 6, GY + 300, { size: 30, weight: 500, fam: 'mono', color: C.dim, alpha: p })
      K.text(L(`${k}_sub`), CX + 6, GY + 346, { size: 24, weight: 500, fam: 'mono', color: C.mute, alpha: p })
    })

    // ── 3. what it buys ──────────────────────────────────────────────
    K.punch(L('punch'), t, 11.2, { x: CX, y: GY + 470, size: 40, maxW: 1840 - CX })
    K.fade(outCubic(seg(t, 1.0, 1.5)), () => K.cite(L('cite')))
  },
})
