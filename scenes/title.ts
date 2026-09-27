/**
 * Title: the talk's name, animated literally. The photo is cut into patches,
 * the patches fly into a row of blue tokens, and gold words come out the other
 * end: pixels → tokens → words. Runs once, then rests.
 */
import { defineScene } from '../lib/scene/types'
import { C } from '../lib/scene/kit'
import { inOutCubic, lerp, outBack, outCubic, outExpo, seg } from '../lib/scene/math'
import { patch, photoAt } from '../lib/scene/photo'

const IMG = { x: 1370, y: 300, s: 420 }
const N = 4
const ROW = { x: 124, y: 790, tile: 46, pitch: 54 }

export default defineScene({
  cues: [4.8],
  draw({ t, L, K, ctx }) {
    K.grid(0.035 * outCubic(seg(t, 0, 1)))
    const x = 120
    K.rise(L('t1'), x, 430, { t, t0: 0.15, size: 132, weight: 700 })
    K.rise(L('t2a'), x, 590, { t, t0: 0.45, size: 132, weight: 700 })
    const w2 = K.measure(`${L('t2a')} `, 132, 700, 'display', -0.02)
    K.rise(L('t2b'), x + w2, 590, { t, t0: 0.6, size: 132, weight: 700, color: C.gen })
    K.words(L('sub'), x + 4, 690, { t, t0: 1.1, size: 38, weight: 500, fam: 'sans', color: C.dim, maxW: 1150, ls: -0.005 })

    // the photo, then its grid
    const ik = outExpo(seg(t, 0.5, 1.4))
    const P = IMG.s / N
    if (ik > 0) {
      K.fade(ik * lerp(1, 0.35, outCubic(seg(t, 2.2, 3.2))), () => {
        ctx.save()
        ctx.translate((1 - ik) * 80, 0)
        photoAt(K, IMG.x, IMG.y, IMG.s)
        K.strokeRR(IMG.x, IMG.y, IMG.s, IMG.s, 12, C.paper, 3)
        ctx.restore()
      })
    }
    const gk = seg(t, 1.5, 2.2)
    const gOut = 1 - outCubic(seg(t, 2.4, 2.8))
    if (gk > 0 && gOut > 0) {
      K.fade(gOut, () => {
        for (let i = 1; i < N; i++) {
          const k = outCubic(seg(gk, i * 0.1, i * 0.1 + 0.6))
          K.line(IMG.x + i * P, IMG.y, IMG.x + i * P, IMG.y + IMG.s * k, C.vis, 3)
          K.line(IMG.x, IMG.y + i * P, IMG.x + IMG.s * k, IMG.y + i * P, C.vis, 3)
        }
      })
    }

    // patches fly into a row of tokens
    for (let n = 0; n < N * N; n++) {
      const i = n % N
      const j = Math.floor(n / N)
      const f0 = 2.3 + n * 0.045
      const fk = inOutCubic(seg(t, f0, f0 + 0.9))
      if (fk <= 0) continue
      const sx = IMG.x + i * P
      const sy = IMG.y + j * P
      const dx = ROW.x + n * ROW.pitch
      const dy = ROW.y - ROW.tile / 2
      const px = lerp(sx, dx, fk)
      const py = lerp(sy, dy, fk) - Math.sin(fk * Math.PI) * (90 + (n % 4) * 20)
      const s = lerp(P, ROW.tile, fk)
      patch(K, i, j, N, px, py, s, s)
      if (fk >= 1) {
        ctx.strokeStyle = C.vis
        ctx.lineWidth = 2.5
        ctx.strokeRect(px, py, s, s)
      }
    }

    // and words come out: the answer, in gold
    const words = L('answer').split('|')
    let wx = ROW.x + N * N * ROW.pitch + 20
    K.fade(outCubic(seg(t, 3.3, 3.6)), () => K.arrow(wx, ROW.y, wx + 44, ROW.y, { color: C.mute, lw: 3, head: 12 }))
    wx += 66
    words.forEach((w, i) => {
      const k = seg(t, 3.5 + i * 0.16, 3.9 + i * 0.16)
      const cw = K.chip(w, wx, ROW.y - 25, { size: 28, h: 50, pad: 14, k: outBack(k), bg: C.genDeep, fg: C.gen })
      wx += cw + 10
    })

    K.fade(outCubic(seg(t, 3.6, 4.4)), () => {
      K.text(L('author'), x, 1000, { size: 24, weight: 500, fam: 'mono', color: C.mute })
    })
  },
})
