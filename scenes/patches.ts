/**
 * An image is worth 16×16 words (ViT).
 *
 *   arrive  title + the photo, labelled 224 × 224 px
 *   1 grid  a 14 × 14 grid draws on: 196 patches of 16 × 16 px
 *   2 fly   every patch lifts off into ONE long strip: a sentence of 196 tokens
 *   3 zoom  the strip opens up: [CLS], a position for each patch, and each
 *           patch becomes a vector. From here on it is only a sequence.
 */
import { defineScene } from '../lib/scene/types'
import { C, W } from '../lib/scene/kit'
import { clamp, hash, inOutCubic, lerp, outBack, outCubic, outExpo, seg } from '../lib/scene/math'
import { patch, photoAt } from '../lib/scene/photo'

const IMG = { x: 150, y: 250, s: 460 }
const N = 14
const ROW_Y = 820
// strip before the zoom: 196 thin slivers edge to edge, like a barcode
const A = { pitch: 9, w: 7.5, h: 56 }
// after the zoom: real tiles, most of them run off the right edge
const B = { pitch: 76, w: 64, h: 64 }
const CLS_W = 104
// the zoom lands on row 8 of the grid, where the mugs and the apple are
const K0 = 8 * N
const GAP_W = 64

export default defineScene({
  cues: [2.2, 5.0, 9.0, 12.6],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)

    const P = IMG.s / N
    const flyStart = 5.2
    const flyAt = (k: number) => flyStart + k * 0.012
    const zoom = inOutCubic(seg(t, 9.2, 10.5))

    // ── the photo ───────────────────────────────────────────────────────
    const ik = outExpo(seg(t, 0.4, 1.3))
    const srcA = lerp(1, 0.25, outCubic(seg(t, 5.2, 7.0))) * (1 - outCubic(seg(t, 9.2, 9.8)))
    if (ik > 0 && srcA > 0) {
      K.fade(ik * srcA, () => {
        photoAt(K, IMG.x, IMG.y, IMG.s)
        K.strokeRR(IMG.x, IMG.y, IMG.s, IMG.s, 12, C.paper, 3)
      })
      K.label(L('px'), IMG.x, IMG.y - 18, { alpha: ik * srcA })
    }

    // ── 1. the grid, and the count ─────────────────────────────────────
    const gk = seg(t, 2.4, 3.6)
    const gridOut = 1 - outCubic(seg(t, 5.2, 5.8))
    if (gk > 0 && gridOut > 0) {
      K.fade(gridOut, () => {
        for (let i = 1; i < N; i++) {
          const k = outCubic(seg(gk, i * 0.03, i * 0.03 + 0.55))
          K.line(IMG.x + i * P, IMG.y, IMG.x + i * P, IMG.y + IMG.s * k, C.vis, 2)
          K.line(IMG.x, IMG.y + i * P, IMG.x + IMG.s * k, IMG.y + i * P, C.vis, 2)
        }
      })
    }
    const cntK = outExpo(seg(t, 3.4, 4.2)) * (1 - outCubic(seg(t, 9.2, 9.6)))
    if (cntK > 0) {
      const cx = IMG.x + IMG.s + 90
      K.text(K.count(0, 196, seg(t, 3.4, 4.4)), cx, IMG.y + 200, { size: 150, weight: 700, fam: 'display', color: C.vis, alpha: cntK })
      K.text(L('count_sub'), cx + 4, IMG.y + 262, { size: 34, weight: 600, fam: 'sans', color: C.paper, alpha: cntK })
      K.text(L('count_math'), cx + 4, IMG.y + 312, { size: 26, weight: 500, fam: 'mono', color: C.mute, alpha: cntK })
    }

    // ── 2 + 3. the strip ───────────────────────────────────────────────
    const ax = W / 2 - (N * N * A.pitch) / 2
    const bx = 72 + CLS_W + 16 + GAP_W + 12
    const tw = lerp(A.w, B.w, zoom)
    const th = lerp(A.h, B.h, zoom)
    for (let k = 0; k < N * N; k++) {
      const i = k % N
      const j = Math.floor(k / N)
      const fk = inOutCubic(seg(t, flyAt(k), flyAt(k) + 0.8))
      const sx = IMG.x + i * P
      const sy = IMG.y + j * P
      if (fk <= 0) {
        if (t >= 2.4 && srcA > 0) K.fade(ik, () => patch(K, i, j, N, sx, sy, P, P))
        continue
      }
      const dx = lerp(ax + k * A.pitch, bx + (k - K0) * B.pitch, zoom)
      if (dx > W + 10 || dx < -B.w * 2) continue
      const x = lerp(sx, dx, fk)
      const y = lerp(sy, ROW_Y - th / 2, fk) - Math.sin(fk * Math.PI) * (60 + (k % 7) * 14)
      const w = lerp(P, tw, fk)
      const h = lerp(P, th, fk)
      // tokens before the zoom window leave while the strip opens up
      const keep = k < K0 ? 1 - outCubic(seg(zoom, 0, 0.5)) : 1
      if (keep <= 0) continue
      ctx.save()
      ctx.globalAlpha *= keep
      patch(K, i, j, N, x, y, w, h)
      ctx.restore()
      if (fk >= 1 && zoom > 0.5) {
        ctx.strokeStyle = C.vis
        ctx.lineWidth = 2.5
        ctx.strokeRect(x, y, w, h)
      }
    }
    const lastLand = flyAt(N * N - 1) + 0.8
    const rowLab = outCubic(seg(t, lastLand - 0.2, lastLand + 0.3)) * (1 - outCubic(seg(t, 9.2, 9.5)))
    K.text(L('row'), W / 2, ROW_Y + 80, { size: 30, weight: 600, fam: 'sans', color: C.paper, align: 'center', alpha: rowLab })
    K.text(L('row_n'), W / 2, ROW_Y + 122, { size: 24, weight: 500, fam: 'mono', color: C.vis, align: 'center', alpha: rowLab })

    // ── 3. [CLS], positions, vectors ───────────────────────────────────
    const cls = outBack(seg(t, 10.3, 10.7))
    if (cls > 0) {
      ctx.save()
      ctx.globalAlpha *= clamp(cls * 2)
      ctx.translate(72 + CLS_W / 2, ROW_Y)
      ctx.scale(0.6 + 0.4 * cls, 0.6 + 0.4 * cls)
      K.fillRR(-CLS_W / 2, -B.h / 2, CLS_W, B.h, 10, C.vis)
      K.text('[CLS]', 0, 2, { size: 24, weight: 600, fam: 'mono', color: C.bg, align: 'center', base: 'middle' })
      ctx.restore()
    }
    const posK = outCubic(seg(t, 10.6, 11.2))
    if (posK > 0) {
      K.text('0', 72 + CLS_W / 2, ROW_Y - B.h / 2 - 18, { size: 22, weight: 500, fam: 'mono', color: C.vis, align: 'center', alpha: posK })
      K.text('…', 72 + CLS_W + 16 + GAP_W / 2, ROW_Y + 10, { size: 40, weight: 600, fam: 'sans', color: C.mute, align: 'center', alpha: posK })
      for (let k = 0; k < 24; k++) {
        const x = bx + k * B.pitch + B.w / 2
        if (x > W - 20) break
        const a = outCubic(seg(t, 10.6 + k * 0.02, 11.0 + k * 0.02))
        K.text(String(K0 + k + 1), x, ROW_Y - B.h / 2 - 18, { size: 22, weight: 500, fam: 'mono', color: C.vis, align: 'center', alpha: a })
      }
      K.label(L('pos'), 72, ROW_Y - B.h / 2 - 58, { alpha: posK, color: C.vis })
    }
    // each token becomes a vector: a little bar code of numbers under it
    const vk = seg(t, 11.0, 11.9)
    if (vk > 0) {
      for (let k = -1; k < 24; k++) {
        const x0 = k < 0 ? 72 + (CLS_W - B.w) / 2 : bx + k * B.pitch
        if (x0 > W - 20) break
        const a = outCubic(seg(vk, (k + 1) * 0.025, (k + 1) * 0.025 + 0.4))
        for (let d = 0; d < 8; d++) {
          const v = hash(k + 3, d) * 2 - 1
          const bh = Math.abs(v) * 40 * a
          ctx.fillStyle = v > 0 ? C.vis : C.dim
          ctx.globalAlpha = a
          ctx.fillRect(x0 + d * 8, ROW_Y + B.h / 2 + 52 - (v > 0 ? bh : 0), 6, bh)
        }
        ctx.globalAlpha = 1
      }
      K.label(L('vec'), 72, ROW_Y + B.h / 2 + 130, { alpha: outCubic(seg(t, 11.4, 11.9)), color: C.dim, size: 26 })
    }

    K.punch(L('punch'), t, 11.8, { x: IMG.x, y: 420, maxW: 1700, size: 56 })
    K.fade(outCubic(seg(t, 3.4, 3.9)), () => K.cite(L('cite')))
  },
})
