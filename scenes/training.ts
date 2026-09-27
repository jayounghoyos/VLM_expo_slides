/**
 * How it is trained: two stages (LLaVA).
 *
 *   arrive  the three blocks, all frozen (locked)
 *   1 align  only the projector unlocks and lights up. Image + caption pairs
 *            stream through: it learns to translate, nothing else moves.
 *   2 tune   the LLM unlocks too, trained on instructions written by a
 *            text-only GPT-4. The vision encoder never unlocks.
 */
import { defineScene } from '../lib/scene/types'
import { C, type Kit } from '../lib/scene/kit'
import { alpha, clamp, mix, outBack, outCubic, outExpo, seg } from '../lib/scene/math'
import { thumb } from '../lib/scene/photo'

const Y = 250
const BH = 200
const BLOCKS = [
  { key: 'enc', x: 110, w: 440 },
  { key: 'prj', x: 700, w: 300 },
  { key: 'llm', x: 1150, w: 660 },
] as const

/** A padlock: closed at open = 0, shackle lifted at open = 1. */
function lock(K: Kit, x: number, y: number, open: number, color: string) {
  const { ctx } = K
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  const lift = open * 16
  ctx.moveTo(x - 14, y - 4 - lift * 0.2)
  ctx.lineTo(x - 14, y - 16 - lift)
  ctx.arc(x, y - 16 - lift, 14, Math.PI, 0)
  ctx.lineTo(x + 14, y - 16 - lift + (open > 0.5 ? -4 : 12))
  ctx.stroke()
  K.fillRR(x - 22, y - 6, 44, 34, 6, color)
  ctx.restore()
}

export default defineScene({
  cues: [2.2, 6.2, 10.2],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)

    const openAt = [1e9, 2.5, 6.5] // the encoder never unlocks
    BLOCKS.forEach((b, i) => {
      const k = outExpo(seg(t, 0.4 + i * 0.12, 1.0 + i * 0.12))
      if (k <= 0) return
      const on = outCubic(seg(t, openAt[i] + 0.3, openAt[i] + 0.9))
      K.fade(k, () => {
        K.fillRR(b.x, Y, b.w, BH, 16, mix(C.table, i === 1 ? C.vis : C.visDeep, on))
        if (on > 0 && i === 2) K.strokeRR(b.x, Y, b.w, BH, 16, alpha(C.vis, on), 3)
        const fg = i === 1 && on > 0.5 ? C.bg : C.paper
        K.text(L(b.key), b.x + 32, Y + 70, { size: 36, weight: 600, fam: 'sans', color: fg })
        const st = on > 0.5 ? L('trains') : L('frozen')
        K.text(st, b.x + 32, Y + 120, { size: 26, weight: 500, fam: 'mono', color: on > 0.5 ? (i === 1 ? C.bg : C.vis) : C.mute })
        lock(K, b.x + b.w - 56, Y + BH - 58, on, on > 0.5 ? (i === 1 ? C.bg : C.vis) : C.mute)
      })
    })
    const ak = outCubic(seg(t, 1.0, 1.4))
    K.arrow(560, Y + BH / 2, 688, Y + BH / 2, { color: C.mute, k: ak })
    K.arrow(1010, Y + BH / 2, 1138, Y + BH / 2, { color: C.mute, k: ak })

    // ── 1. stage one: align ────────────────────────────────────────────
    const s1 = outExpo(seg(t, 3.0, 3.6))
    const S1X = 110
    const SY = 560
    if (s1 > 0) {
      K.text(L('s1'), S1X, SY + 40, { size: 44, weight: 700, fam: 'display', color: C.paper, alpha: s1 })
      // a caption card: picture + words, streaming up into the pipeline
      for (let n = 0; n < 3; n++) {
        const k = outBack(seg(t, 3.4 + n * 0.15, 3.8 + n * 0.15))
        if (k <= 0) continue
        const x = S1X + n * 112
        K.fade(clamp(k * 2), () => thumb(K, (['table', 'cat', 'bike'] as const)[n], x, SY + 80, 96))
      }
      K.text(L('cap1'), S1X + 3 * 112 + 16, SY + 138, { size: 28, weight: 500, fam: 'mono', color: C.dim, alpha: outCubic(seg(t, 3.8, 4.2)) })
      K.text(K.count(0, 595, seg(t, 4.2, 5.2)) + ' K', S1X, SY + 290, { size: 84, weight: 700, fam: 'display', color: C.vis, alpha: outCubic(seg(t, 4.2, 4.6)) })
      K.text(L('s1_data'), S1X + 4, SY + 336, { size: 28, weight: 600, fam: 'sans', color: C.paper, alpha: outCubic(seg(t, 4.5, 4.9)) })
    }

    // ── 2. stage two: follow instructions ──────────────────────────────
    const s2 = outExpo(seg(t, 7.0, 7.6))
    const S2X = 1000
    if (s2 > 0) {
      K.text(L('s2'), S2X, SY + 40, { size: 44, weight: 700, fam: 'display', color: C.paper, alpha: s2 })
      const qk = seg(t, 7.4, 8.3)
      K.chip(L('you'), S2X, SY + 82, { size: 22, h: 38, pad: 12, k: outBack(seg(t, 7.3, 7.6)), bg: '#1D2C4A', fg: C.paper })
      K.typeText(L('ex_q'), S2X + 90, SY + 110, qk, { size: 30, weight: 600, color: C.paper, maxW: 720 })
      K.chip('VLM', S2X, SY + 142, { size: 22, h: 38, pad: 12, k: outBack(seg(t, 8.2, 8.5)), bg: C.visDeep, fg: C.vis })
      K.typeText(L('ex_a'), S2X + 90, SY + 170, seg(t, 8.3, 9.1), { size: 30, weight: 600, color: C.gen, maxW: 720 })
      K.text(K.count(0, 158, seg(t, 8.6, 9.4)) + ' K', S2X, SY + 290, { size: 84, weight: 700, fam: 'display', color: C.vis, alpha: outCubic(seg(t, 8.6, 9.0)) })
      K.text(L('s2_data'), S2X + 4, SY + 336, { size: 28, weight: 600, fam: 'sans', color: C.paper, alpha: outCubic(seg(t, 8.9, 9.3)) })
    }
    K.fade(outCubic(seg(t, 4.2, 4.7)), () => K.cite(L('cite')))
  },
})
