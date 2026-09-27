/**
 * Hook: the same question, asked twice.
 *
 *   arrive  title, the photo, the question typed in
 *   1 llm   a plain language model answers: it cannot see. The photo it
 *           "receives" fades to nothing.
 *   2 vlm   a VLM answers, in gold, while the photo comes back cut into
 *           patches. Punch: it read the internet but never saw a mug.
 */
import { defineScene } from '../lib/scene/types'
import { C } from '../lib/scene/kit'
import { alpha, lerp, outBack, outCubic, outExpo, seg } from '../lib/scene/math'
import { photoAt } from '../lib/scene/photo'

const IMG = { x: 110, y: 250, s: 520 }
const CX = 760 // the chat column
const TAG_W = 120

export default defineScene({
  cues: [2.6, 6.2, 10.0],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)

    // ── the photo: fades to "nothing" for the LLM, returns for the VLM ──
    const ik = outExpo(seg(t, 0.3, 1.1))
    const gone = outCubic(seg(t, 3.0, 3.8)) * (1 - outCubic(seg(t, 6.4, 7.2)))
    K.fade(ik, () => {
      ctx.save()
      ctx.globalAlpha *= lerp(1, 0.08, gone)
      photoAt(K, IMG.x, IMG.y, IMG.s)
      ctx.restore()
      K.strokeRR(IMG.x, IMG.y, IMG.s, IMG.s, 14, lerp(0, 1, gone) > 0.5 ? C.faint : C.paper, 3)
    })
    K.text('?', IMG.x + IMG.s / 2, IMG.y + IMG.s / 2 + 70, { size: 220, weight: 700, fam: 'display', color: C.mute, align: 'center', alpha: gone })
    // the VLM sees it as patches: a grid draws over the returning photo
    const gk = seg(t, 6.8, 7.8)
    if (gk > 0) {
      const n = 8
      const P = IMG.s / n
      for (let i = 1; i < n; i++) {
        const k = outCubic(seg(gk, i * 0.05, i * 0.05 + 0.6))
        K.line(IMG.x + i * P, IMG.y, IMG.x + i * P, IMG.y + IMG.s * k, alpha(C.vis, 0.8), 2)
        K.line(IMG.x, IMG.y + i * P, IMG.x + IMG.s * k, IMG.y + i * P, alpha(C.vis, 0.8), 2)
      }
    }

    // ── the chat ──────────────────────────────────────────────────────
    const row = (tag: string, col: string, bg: string, y: number, t0: number, body: string, bodyCol: string, typeDur: number) => {
      const k = outBack(seg(t, t0, t0 + 0.4))
      if (k <= 0) return
      K.chip(tag, CX, y - 34, { size: 24, h: 44, pad: 14, k, bg, fg: col, align: 'left' })
      const tk = seg(t, t0 + 0.3, t0 + 0.3 + typeDur)
      K.typeText(body, CX + TAG_W + 30, y, tk, { size: 40, weight: 600, fam: 'sans', color: bodyCol, maxW: 1840 - CX - TAG_W - 30, lh: 1.2 })
    }
    row(L('you'), C.paper, '#1D2C4A', 330, 0.8, L('q'), C.paper, 1.0)
    row('LLM', C.dim, '#1D2C4A', 520, 2.8, L('llm_a'), C.dim, 1.4)
    // the LLM's answer is struck through once the VLM has spoken
    const strike = outCubic(seg(t, 8.6, 9.0))
    if (strike > 0) {
      const w = K.measure(L('llm_a'), 40, 600, 'sans')
      const x0 = CX + TAG_W + 30
      K.line(x0, 506, x0 + Math.min(w, 1840 - x0) * strike, 506, C.warn, 4)
    }
    row('VLM', C.vis, C.visDeep, 710, 6.6, L('vlm_a'), C.gen, 1.6)

    K.punch(L('punch'), t, 8.9, { y: 960, size: 46 })
  },
})
