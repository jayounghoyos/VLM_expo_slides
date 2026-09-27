/**
 * How a movement becomes tokens (ported from the VLA talk, then extended).
 *
 *   arrive  title, empty plot, a small arm
 *   1 curve  one joint over one second draws as a curve; the arm moves in sync
 *   2 bins   sampled, snapped into bins: a staircase, and each step is a token id
 *   3 vocab  where those ids live: the last 256 slots of the LLM's vocabulary,
 *            its least-used words, now repurposed as "words for moving"
 *
 * The plot shows 24 bin lines, not 256: at projector scale 256 lines are a
 * grey wash. The label says so.
 */
import { defineScene } from '../lib/scene/types'
import { C } from '../lib/scene/kit'
import { alpha, clamp, hash, inOutCubic, lerp, outBack, outCubic, outExpo, presence, seg } from '../lib/scene/math'
import { arm } from '../lib/scene/robot'

const PX = 190
const PY = 290
const PW = 1060
const PH = 440
const MID = PY + PH / 2
const N = 30
const SHOWN_BINS = 24

/** The joint's normalised angle over one second, in [-1, 1]. */
const joint = (u: number) => 0.62 * Math.sin(Math.PI * (u * 1.25 - 0.18)) + 0.2 * Math.sin(2 * Math.PI * 2.1 * u + 0.4)
const px = (u: number) => PX + u * PW
const py = (v: number) => MID - v * (PH / 2) * 0.92
const bin256 = (v: number) => Math.round(((clamp(v, -1, 1) + 1) / 2) * 255)
const snapShown = (v: number) => {
  const step = 2 / SHOWN_BINS
  return clamp(Math.round((v + 1) / step) * step - 1, -1, 1)
}

const T_CURVE = [2.2, 4.4] as const
const T_DROP = 5.0
const T_SNAP = [7.0, 7.8] as const
const T_IDS = 8.2
const T_VOC = 9.6

export default defineScene({
  cues: [2.0, 4.8, 9.4, 13.4],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t)
    const plotA = 1 - outCubic(seg(t, T_VOC, T_VOC + 0.5))

    // ── the plot ──────────────────────────────────────────────────────
    K.fade(plotA, () => {
      const ax = outExpo(seg(t, 0.4, 1.4))
      K.line(PX, PY + PH, PX + PW * ax, PY + PH, C.faint, 3)
      K.line(PX, PY + PH, PX, PY + PH - PH * ax, C.faint, 3)
      K.fade(presence(t, 0.9), () => {
        K.label(L('axis_t'), PX + PW, PY + PH + 44, { align: 'right' })
        K.label(L('axis_a'), PX - 20, PY - 22)
      })
      if (t > T_SNAP[0] - 0.8) {
        for (let b = 0; b <= SHOWN_BINS; b++) {
          const v = -1 + (2 * b) / SHOWN_BINS
          const k = outExpo(seg(t, T_SNAP[0] - 0.8 + b * 0.02, T_SNAP[0] - 0.4 + b * 0.02))
          if (k > 0) K.line(PX, py(v), PX + PW * k, py(v), alpha(C.vis, 0.25), 1.5)
        }
        K.fade(presence(t, T_SNAP[0] - 0.3), () => K.label(L('bins'), PX + PW + 24, py(1) + 8, { color: C.vis }))
      }
      const ck = inOutCubic(seg(t, T_CURVE[0], T_CURVE[1]))
      ctx.save()
      ctx.globalAlpha *= lerp(1, 0.3, outCubic(seg(t, T_DROP, T_DROP + 0.6)))
      const end = K.trace(K.sample((u) => ({ x: px(u), y: py(joint(u)) }), 120), ck, { color: C.gen, lw: 6 })
      ctx.restore()
      if (ck > 0 && ck < 1 && end) K.dot(end.x, end.y, 12, C.gen)

      const snapK = inOutCubic(seg(t, T_SNAP[0], T_SNAP[1]))
      const pts: { x: number; y: number }[] = []
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1)
        const v = joint(u)
        const vs = lerp(v, snapShown(v), snapK)
        pts.push({ x: px(u), y: py(vs) })
        const dk = seg(t, T_DROP + i * 0.05, T_DROP + i * 0.05 + 0.35)
        if (dk <= 0) continue
        const y = lerp(PY - 60, py(vs), outBack(dk, 1.2))
        K.fade(clamp(dk * 4), () => K.dot(px(u), y, 9, C.paper))
      }
      const sk = outCubic(seg(t, T_SNAP[1] - 0.2, T_SNAP[1] + 0.4))
      if (sk > 0) {
        const stair: { x: number; y: number }[] = []
        pts.forEach((p, i) => {
          if (i > 0) stair.push({ x: p.x, y: pts[i - 1].y })
          stair.push(p)
        })
        K.trace(stair, sk, { color: C.paper, lw: 3 })
      }
      if (t > T_IDS) {
        for (let i = 0; i < 11; i++) {
          const k = seg(t, T_IDS + i * 0.06, T_IDS + i * 0.06 + 0.3)
          if (k <= 0) continue
          K.chip(String(31744 + bin256(joint(i / (N - 1)))), PX + i * 98, PY + PH + 84, { size: 24, k: outBack(k), h: 44, pad: 10, bg: C.genDeep, fg: C.gen })
        }
        K.fade(presence(t, T_IDS + 0.7), () => K.text('…', PX + 11 * 98 + 8, PY + PH + 118, { size: 36, color: C.gen, fam: 'mono' }))
      }
    })

    // ── the small arm, in sync with the curve ─────────────────────────
    K.fade(plotA * outExpo(seg(t, 0.8, 1.6)), () => {
      const v = joint(inOutCubic(seg(t, T_CURVE[0], T_CURVE[1])))
      const bx = 1570
      const by = 780
      const th = -Math.PI / 2 + 0.25 - v * 0.9 // the shoulder follows the plotted joint
      const l1 = 380
      const l2 = 340
      const sh = { x: 0, y: -96 }
      const el = { x: sh.x + l1 * Math.cos(th), y: sh.y + l1 * Math.sin(th) }
      const wr = { x: el.x + l2 * Math.cos(th + 1.9), y: el.y + l2 * Math.sin(th + 1.9) }
      ctx.save()
      ctx.translate(bx, by)
      ctx.scale(0.72, 0.72)
      K.fillRR(-220, 0, 440, 22, 6, C.table)
      arm(K, { x: 0, y: 0 }, wr, { l1, l2, grip: 0.7, accent: C.gen })
      ctx.strokeStyle = C.gen
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.arc(sh.x, sh.y, 58, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
      K.fade(presence(t, 1.2), () => K.label(L('joint'), bx, by + 64, { align: 'center', color: C.gen }))
    })

    K.fade(plotA, () => {
      K.punch(L('p1'), t, 2.5, { y: 975, size: 40, tout: 4.95 })
      K.punch(L('p2'), t, 8.0, { y: 975, size: 40 })
    })

    // ── 3. the vocabulary ─────────────────────────────────────────────
    const vk = outExpo(seg(t, T_VOC + 0.6, T_VOC + 1.4))
    if (vk > 0) {
      const X0 = 110
      const X1 = 1810
      const BY = 420
      const BH = 70
      const NC = 160
      const cw = (X1 - X0) / NC
      K.label(L('vocab'), X0, 340, { size: 28, color: C.dim, alpha: vk })
      for (let c = 0; c < NC; c++) {
        const k = outCubic(seg(t, T_VOC + 0.6 + c * 0.004, T_VOC + 1.0 + c * 0.004))
        if (k <= 0) continue
        ctx.fillStyle = alpha(C.vis, (0.25 + 0.5 * hash(c, 9)) * k)
        ctx.fillRect(X0 + c * cw + 1, BY, cw - 2, BH)
      }
      const words = L('words').split('|')
      words.forEach((w, i) => {
        const c = 6 + i * 24
        K.text(w, X0 + c * cw + cw / 2, BY - 16, { size: 24, weight: 500, fam: 'mono', color: C.dim, align: 'center', alpha: outCubic(seg(t, T_VOC + 1.0 + i * 0.06, T_VOC + 1.4 + i * 0.06)) })
      })
      // the last 256 of 32 000: a sliver, then a zoom onto it
      const sw = Math.max(6, ((X1 - X0) * 256) / 32000)
      const hk = outCubic(seg(t, T_VOC + 1.5, T_VOC + 1.9))
      K.fade(hk, () => K.fillRR(X1 - sw, BY - 10, sw, BH + 20, 3, C.gen))
      const zk = outCubic(seg(t, T_VOC + 1.9, T_VOC + 2.5))
      const ZX0 = 560
      const ZY = 620
      if (zk > 0) {
        K.line(X1 - sw, BY + BH + 12, lerp(X1 - sw, ZX0, zk), lerp(BY + BH + 12, ZY - 10, zk), alpha(C.gen, 0.7), 2)
        K.line(X1, BY + BH + 12, X1, lerp(BY + BH + 12, ZY - 10, zk), alpha(C.gen, 0.7), 2)
      }
      const ids = ['31744', '31745', '31746', '…', '31997', '31998', '31999']
      const step = (X1 - ZX0) / ids.length
      ids.forEach((s, i) => {
        const k = seg(t, T_VOC + 2.3 + i * 0.06, T_VOC + 2.7 + i * 0.06)
        if (s === '…') K.text(s, ZX0 + i * step + step / 2 - 12, ZY + 38, { size: 36, fam: 'mono', color: C.gen, alpha: k })
        else K.chip(s, ZX0 + i * step + 6, ZY, { size: 26, h: 52, pad: 12, k: outBack(k), bg: C.genDeep, fg: C.gen })
      })
      K.text(L('least'), ZX0, ZY + 120, { size: 32, weight: 600, fam: 'sans', color: C.paper, alpha: outCubic(seg(t, T_VOC + 2.7, T_VOC + 3.1)) })
      K.punch(L('p3'), t, T_VOC + 2.6, { y: 975, size: 46 })
    }
    K.fade(outCubic(seg(t, 0.6, 1.0)), () => K.cite(L('cite')))
  },
})
