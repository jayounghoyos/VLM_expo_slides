/**
 * The bridge: a projector (LLaVA).
 *
 *   arrive  photo → vision encoder → projector → language model, idle
 *   1 map   image vectors pass through the projector and come out as blue
 *           "word" vectors, which drop into a row: the image part of the input
 *   2 join  the question joins the row, and the whole row enters the LLM
 *   3 say   the LLM answers in gold. For the LLM, the image was just words.
 */
import { defineScene } from '../lib/scene/types'
import { C } from '../lib/scene/kit'
import { inOutCubic, lerp, outBack, outCubic, seg } from '../lib/scene/math'
import { ENC, LLM, MID, PRJ, ROW, imageToken, pipeline, rowTextX } from '../lib/scene/pipeline'

const ROW_Y = ROW.y
const ROW_X = ROW.x
const NT = ROW.n
const TP = ROW.pitch
const TS = ROW.tile

export default defineScene({
  cues: [2.2, 5.6, 9.0, 12.4],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)

    // ── the pipeline ───────────────────────────────────────────────────
    const lab = { enc: L('enc'), encSub: L('enc_sub'), prj: L('prj'), llm: L('llm'), llmSub: L('llm_sub') }
    pipeline(K, t, lab, { lit: outCubic(seg(t, 7.6, 8.2)) })
    const mid = MID

    // ── 1. vectors through the projector, down into the row ─────────────
    for (let n = 0; n < 6; n++) {
      const a0 = 2.4 + n * 0.12
      const k = inOutCubic(seg(t, a0, a0 + 0.7))
      if (k <= 0 || k >= 1) continue
      const y = mid - 75 + n * 30
      const x = lerp(ENC.x + ENC.w - 40, PRJ.x + 40, k)
      ctx.globalAlpha = Math.sin(k * Math.PI)
      K.fillRR(x - 11, y - 11, 22, 22, 4, C.dim)
      ctx.globalAlpha = 1
    }
    for (let n = 0; n < NT; n++) {
      const a0 = 3.4 + n * 0.055
      const k = inOutCubic(seg(t, a0, a0 + 0.9))
      if (k <= 0) continue
      const sx = PRJ.x + PRJ.w / 2
      const sy = PRJ.y + PRJ.h - 10
      const dx = ROW_X + n * TP
      const x = lerp(sx, dx, k)
      const y = lerp(sy, ROW_Y - TS / 2, k) - Math.sin(k * Math.PI) * 40
      imageToken(K, n, x, y)
    }
    const mapLab = outCubic(seg(t, 3.6, 4.2))
    K.text(L('map'), PRJ.x + PRJ.w / 2, PRJ.y + PRJ.h + 76, { size: 26, weight: 500, fam: 'mono', color: C.vis, align: 'center', alpha: mapLab * (1 - outCubic(seg(t, 5.8, 6.1))) })

    // ── 2. the question joins; the row enters the LLM ──────────────────
    const q = L('q').split('|')
    let qx = rowTextX
    const qx0 = qx
    q.forEach((w, i) => {
      const k = seg(t, 5.8 + i * 0.1, 6.2 + i * 0.1)
      qx += K.chip(w, qx, ROW_Y - 28, { size: 32, h: 56, pad: 14, k: outBack(k), bg: '#1D2C4A', fg: C.paper }) + 10
    })
    const qx1 = qx - 10
    const br = outCubic(seg(t, 6.5, 7.0))
    if (br > 0) {
      const lab = (s: string, a: number, b: number, col: string) => {
        K.line(a, ROW_Y + 48, b, ROW_Y + 48, col, 2)
        K.text(s, (a + b) / 2, ROW_Y + 88, { size: 26, weight: 500, fam: 'mono', color: col, align: 'center' })
      }
      K.fade(br, () => {
        lab(L('g_img'), ROW_X, ROW_X + NT * TP - 6, C.vis)
        lab(L('g_q'), qx0, qx1, C.paper)
      })
    }
    const up = outCubic(seg(t, 7.1, 7.9))
    const u0 = { x: (ROW_X + qx1) / 2 + 120, y: ROW_Y - 44 }
    const u1 = { x: LLM.x + 150, y: LLM.y + LLM.h + 16 }
    K.arrow(u0.x, u0.y, u1.x, u1.y, { color: C.paper, lw: 3, k: up })
    K.text(L('one_seq'), (u0.x + u1.x) / 2 + 36, (u0.y + u1.y) / 2 + 44, { size: 30, weight: 600, fam: 'sans', color: C.paper, alpha: outCubic(seg(t, 7.6, 8.1)) })

    // ── 3. the answer ─────────────────────────────────────────────────
    const down = outCubic(seg(t, 9.2, 9.8))
    const ax = qx1 + 90
    K.arrow(LLM.x + LLM.w - 180, LLM.y + LLM.h + 16, ax + 60, ROW_Y - 44, { color: C.gen, lw: 3, k: down })
    let gx = ax
    L('a').split('|').forEach((w, i) => {
      const k = seg(t, 9.8 + i * 0.18, 10.2 + i * 0.18)
      gx += K.chip(w, gx, ROW_Y - 28, { size: 32, h: 56, pad: 14, k: outBack(k), bg: C.genDeep, fg: C.gen }) + 10
    })

    K.punch(L('punch'), t, 10.8, { y: 975, size: 44 })
    K.fade(outCubic(seg(t, 6.5, 7.0)), () => K.cite(L('cite')))
  },
})
