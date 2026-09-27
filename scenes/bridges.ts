/**
 * Three ways to connect an image to a language model, one per click.
 * Each column: the image (3 × 3 patches) on top, the LLM at the bottom, and
 * the connector in between is the only thing that changes.
 *
 *   1 projector   every image token goes in (LLaVA)
 *   2 Q-Former    a few learned queries summarise the image first (BLIP-2)
 *   3 cross-attn  the frozen LLM looks at the image inside every layer (Flamingo)
 */
import { defineScene } from '../lib/scene/types'
import { C, type Kit } from '../lib/scene/kit'
import { alpha, clamp, inOutCubic, lerp, outBack, outCubic, outExpo, seg } from '../lib/scene/math'
import { patch } from '../lib/scene/photo'

const COL_W = 540
const X0 = [90, 700, 1310]
const GRID = { y: 270, s: 168 }
const ROW_Y = 520
const LLM_Y = 580
const LLM_H = 70
const STARTS = [2.4, 5.6, 8.8]

function grid(K: Kit, x: number, y: number, s: number, k: number) {
  if (k <= 0) return
  const p = s / 3
  for (let n = 0; n < 9; n++) {
    const i = n % 3
    const j = Math.floor(n / 3)
    const a = outBack(seg(k, n * 0.05, n * 0.05 + 0.6))
    if (a <= 0) continue
    const sz = (p - 6) * (0.6 + 0.4 * a)
    K.ctx.save()
    K.ctx.globalAlpha *= clamp(a * 2)
    patch(K, i, j, 3, x + i * p + (p - sz) / 2, y + j * p + (p - sz) / 2, sz, sz)
    K.ctx.restore()
  }
}

function llmBar(K: Kit, x: number, y: number, w: number, h: number, k: number, label: string) {
  if (k <= 0) return
  K.fade(clamp(k * 2), () => {
    K.fillRR(x, y, w * outExpo(k), h, 12, C.table)
    K.text(label, x + 24, y + h / 2 + 2, { size: 28, weight: 600, fam: 'sans', base: 'middle', alpha: outCubic(seg(k, 0.4, 1)) })
  })
}

function vToken(K: Kit, x: number, y: number, s = 30, a = 1) {
  K.fillRR(x - s / 2, y - s / 2, s, s, 6, alpha(C.vis, a))
}

export default defineScene({
  cues: [2.2, 5.4, 8.6, 11.8],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)

    X0.forEach((x0, c) => {
      const u = t - STARTS[c]
      // placeholder numeral, hollow, until the column arrives
      const ph = outCubic(seg(t, 0.4 + c * 0.1, 1.2 + c * 0.1)) * (1 - outCubic(seg(u, 0, 0.4)))
      if (ph > 0) {
        ctx.save()
        ctx.globalAlpha = 0.14 * ph
        K.setFont(300, 700, 'display')
        ctx.strokeStyle = C.paper
        ctx.lineWidth = 3
        ctx.textAlign = 'center'
        ctx.strokeText(String(c + 1), x0 + COL_W / 2, 640)
        ctx.restore()
      }
      if (u <= 0) return
      const gx = x0
      grid(K, gx, GRID.y, GRID.s, seg(u, 0, 0.7))
      const ga = { x: gx + GRID.s + 12, y: GRID.y + GRID.s / 2 }

      if (c === 0) {
        // projector: every token through the MLP, all of them into the LLM
        const bx = x0 + 300
        const by = GRID.y + 40
        K.arrow(ga.x, ga.y, bx - 12, ga.y, { color: C.mute, k: outCubic(seg(u, 0.4, 0.7)) })
        const bk = outBack(seg(u, 0.6, 1.0))
        if (bk > 0) {
          K.fade(clamp(bk * 2), () => {
            K.fillRR(bx, by, 150, 88, 12, C.vis)
            K.text('MLP', bx + 75, by + 46, { size: 34, weight: 700, fam: 'display', color: C.bg, align: 'center', base: 'middle' })
          })
        }
        for (let n = 0; n < 9; n++) {
          const k = inOutCubic(seg(u, 1.0 + n * 0.06, 1.6 + n * 0.06))
          if (k <= 0) continue
          const tx = x0 + 24 + n * 56
          vToken(K, lerp(bx + 75, tx, k), lerp(by + 88, ROW_Y, k))
        }
        for (let n = 0; n < 9; n++) {
          const k = outCubic(seg(u, 1.8 + n * 0.03, 2.1 + n * 0.03))
          const tx = x0 + 24 + n * 56
          if (k > 0) K.line(tx, ROW_Y + 20, tx, lerp(ROW_Y + 20, LLM_Y - 6, k), alpha(C.vis, 0.7), 3)
        }
      }
      else if (c === 1) {
        // Q-Former: a few queries read the whole image, only they go in
        const bx = x0 + 250
        const by = GRID.y - 6
        const bw = 270
        const bh = 180
        K.arrow(ga.x, ga.y, bx - 12, ga.y, { color: C.mute, k: outCubic(seg(u, 0.4, 0.7)) })
        const bk = outExpo(seg(u, 0.6, 1.0))
        if (bk > 0) {
          K.fade(bk, () => {
            K.fillRR(bx, by, bw, bh, 14, C.visDeep)
            K.strokeRR(bx, by, bw, bh, 14, C.vis, 3)
            K.text('Q-Former', bx + 24, by + 48, { size: 30, weight: 700, fam: 'display', color: C.vis })
          })
        }
        const qs = [0, 1, 2, 3].map((q) => ({ x: bx + 48 + q * 58, y: by + 120 }))
        qs.forEach((p, q) => {
          const k = outBack(seg(u, 0.9 + q * 0.07, 1.25 + q * 0.07))
          if (k > 0) K.dot(p.x, p.y, 18 * k, C.vis)
        })
        // each query reads a few patches
        const rk = seg(u, 1.2, 1.9)
        if (rk > 0) {
          const p = GRID.s / 3
          for (let q = 0; q < 4; q++) {
            for (const n of [q, q + 3, (q * 2 + 4) % 9]) {
              const k = outCubic(seg(rk, q * 0.1, q * 0.1 + 0.6))
              const sx = gx + (n % 3) * p + p / 2
              const sy = GRID.y + Math.floor(n / 3) * p + p / 2
              ctx.save()
              ctx.globalAlpha *= 0.3
              K.trace([{ x: sx, y: sy }, { x: qs[q].x, y: qs[q].y }], k, { color: C.vis, lw: 2 })
              ctx.restore()
            }
          }
        }
        for (let q = 0; q < 4; q++) {
          const k = inOutCubic(seg(u, 1.9 + q * 0.08, 2.4 + q * 0.08))
          if (k <= 0) continue
          const tx = x0 + 150 + q * 70
          vToken(K, lerp(qs[q].x, tx, k), lerp(qs[q].y, ROW_Y, k))
          const lk = outCubic(seg(u, 2.4 + q * 0.03, 2.7 + q * 0.03))
          if (lk > 0) K.line(tx, ROW_Y + 20, tx, lerp(ROW_Y + 20, LLM_Y - 6, lk), alpha(C.vis, 0.7), 3)
        }
      }
      else {
        // cross-attention: the LLM's layers each look sideways at the image
        const lx = x0 + 240
        const lw = 300
        for (let l = 0; l < 6; l++) {
          const y = GRID.y - 4 + l * 64
          const k = outExpo(seg(u, 0.5 + l * 0.08, 1.0 + l * 0.08))
          if (k > 0) K.fade(k, () => K.fillRR(lx, y, lw * k, 44, 8, C.table))
          const ak = outCubic(seg(u, 1.2 + l * 0.15, 1.6 + l * 0.15))
          if (ak > 0) K.arrow(ga.x - 4, ga.y + (l - 2.5) * 22, lx - 10, y + 22, { color: C.vis, lw: 3, k: ak, head: 12 })
        }
        const fk = outCubic(seg(u, 1.0, 1.4))
        K.text('LLM', lx + 20, GRID.y + 30, { size: 28, weight: 600, fam: 'sans', alpha: fk })
        K.text(L('frozen'), lx + lw - 20, GRID.y + 28, { size: 22, weight: 500, fam: 'mono', color: C.mute, align: 'right', alpha: fk })
      }

      if (c < 2) llmBar(K, x0, LLM_Y, COL_W - 40, LLM_H, seg(u, 0.2, 0.9), 'LLM')

      // name, one line of why, and who
      const nk = seg(u, 1.4, 2.6)
      K.words(L(`n${c + 1}`), x0, 730, { t: u, t0: 1.4, size: 42, weight: 700, fam: 'display', maxW: COL_W - 20, ls: -0.01 })
      K.words(L(`c${c + 1}`), x0, 790, { t: u, t0: 1.6, size: 30, weight: 500, fam: 'sans', color: C.dim, maxW: COL_W - 30, stagger: 0.02, lh: 1.25, ls: -0.005 })
      K.text(L(`w${c + 1}`), x0, 920, { size: 24, weight: 500, fam: 'mono', color: C.vis, alpha: outCubic(seg(nk, 0.5, 1)) })
    })

    K.fade(outCubic(seg(t, 2.6, 3.0)), () => K.cite(L('cite')))
  },
})
