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
import { C, type Kit } from '../lib/scene/kit'
import { alpha, clamp, hash, inOutCubic, lerp, outBack, outCubic, outExpo, seg } from '../lib/scene/math'
import { photoAt } from '../lib/scene/photo'

const IMG = { x: 110, y: 270, s: 240 }
const ENC = { x: 440, y: 250, w: 330, h: 280 }
const PRJ = { x: 870, y: 300, w: 200, h: 180 }
const LLM = { x: 1170, y: 250, w: 670, h: 280 }
const ROW_Y = 790
const ROW_X = 110
const NT = 20
const TP = 38
const TS = 32

function block(K: Kit, b: { x: number; y: number; w: number; h: number }, k: number, fill: string, stroke?: string) {
  if (k <= 0) return
  const { ctx } = K
  ctx.save()
  ctx.globalAlpha *= clamp(k * 2)
  const s = lerp(0.94, 1, outExpo(k))
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2)
  ctx.scale(s, s)
  K.fillRR(-b.w / 2, -b.h / 2, b.w, b.h, 14, fill)
  if (stroke) K.strokeRR(-b.w / 2, -b.h / 2, b.w, b.h, 14, stroke, 3)
  ctx.restore()
}

export default defineScene({
  cues: [2.2, 5.6, 9.0, 12.4],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)

    // ── the pipeline ───────────────────────────────────────────────────
    const pk = outExpo(seg(t, 0.3, 1.1))
    K.fade(pk, () => {
      photoAt(K, IMG.x, IMG.y + 20, IMG.s)
      K.strokeRR(IMG.x, IMG.y + 20, IMG.s, IMG.s, 12, C.paper, 3)
    })
    const ek = seg(t, 0.55, 1.2)
    block(K, ENC, ek, C.table)
    K.text(L('enc'), ENC.x + ENC.w / 2, ENC.y + ENC.h / 2 - 6, { size: 34, weight: 600, fam: 'sans', align: 'center', alpha: ek })
    K.text(L('enc_sub'), ENC.x + ENC.w / 2, ENC.y + ENC.h / 2 + 40, { size: 24, weight: 500, fam: 'mono', color: C.mute, align: 'center', alpha: ek })
    const jk = seg(t, 0.8, 1.4)
    block(K, PRJ, jk, C.vis)
    K.text('MLP', PRJ.x + PRJ.w / 2, PRJ.y + PRJ.h / 2 + 2, { size: 44, weight: 700, fam: 'display', color: C.bg, align: 'center', base: 'middle', alpha: jk })
    K.text(L('prj'), PRJ.x + PRJ.w / 2, PRJ.y - 22, { size: 26, weight: 600, fam: 'mono', color: C.vis, align: 'center', alpha: jk })
    const lk = seg(t, 1.05, 1.7)
    const lit = outCubic(seg(t, 7.6, 8.2))
    block(K, LLM, lk, C.table, lit > 0 ? alpha(C.vis, lit) : undefined)
    K.text(L('llm'), LLM.x + LLM.w / 2, LLM.y + LLM.h / 2 - 6, { size: 34, weight: 600, fam: 'sans', align: 'center', alpha: lk })
    K.text(L('llm_sub'), LLM.x + LLM.w / 2, LLM.y + LLM.h / 2 + 40, { size: 24, weight: 500, fam: 'mono', color: C.mute, align: 'center', alpha: lk })
    const mid = ENC.y + ENC.h / 2
    K.arrow(IMG.x + IMG.s + 14, mid, ENC.x - 14, mid, { color: C.mute, k: outCubic(seg(t, 1.2, 1.6)) })
    K.arrow(ENC.x + ENC.w + 14, mid, PRJ.x - 14, mid, { color: C.mute, k: outCubic(seg(t, 1.35, 1.75)) })
    K.arrow(PRJ.x + PRJ.w + 14, mid, LLM.x - 14, mid, { color: C.mute, k: outCubic(seg(t, 1.5, 1.9)) })

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
      K.fillRR(x, y, TS, TS, 6, alpha(C.vis, 0.55 + 0.45 * hash(n, 5)))
    }
    const mapLab = outCubic(seg(t, 3.6, 4.2))
    K.text(L('map'), PRJ.x + PRJ.w / 2, PRJ.y + PRJ.h + 76, { size: 26, weight: 500, fam: 'mono', color: C.vis, align: 'center', alpha: mapLab * (1 - outCubic(seg(t, 5.8, 6.1))) })

    // ── 2. the question joins; the row enters the LLM ──────────────────
    const q = L('q').split('|')
    let qx = ROW_X + NT * TP + 18
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
