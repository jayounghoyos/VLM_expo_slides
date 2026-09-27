/**
 * Where it goes wrong: three vignettes that swap in place, one per click.
 *
 *   1 hallucinate  asked about a fork that isn't there, it says yes (POPE:
 *                  it invents objects that usually co-occur)
 *   2 blind        the photo and its mirror image get the same answer: to
 *                  CLIP they are almost the same picture (MMVP)
 *   3 count        seven mugs, it says five (MMVP: quantity and count)
 *
 * The answers are illustrative; the failure modes are the papers'.
 */
import { defineScene } from '../lib/scene/types'
import { C, type Kit } from '../lib/scene/kit'
import { outBack, outCubic, outExpo, presence, seg } from '../lib/scene/math'
import { OBJ, photoAt } from '../lib/scene/photo'

const TX = 980 // text column
// each vignette: in at a, typed by a + 2.8, punchline settled by a + 4.4 (the
// cue), then out at b while the next one comes in 0.2 s later
const WIN = [
  { a: 2.2, b: 6.6 },
  { a: 6.8, b: 11.2 },
  { a: 11.4, b: 1e9 },
] as const

function cross(K: Kit, x: number, y: number, s: number, k: number) {
  if (k <= 0) return
  K.line(x - s, y - s, x - s + 2 * s * Math.min(1, k * 2), y - s + 2 * s * Math.min(1, k * 2), C.warn, 7)
  if (k > 0.5) K.line(x + s, y - s, x + s - 2 * s * (k - 0.5) * 2, y - s + 2 * s * (k - 0.5) * 2, C.warn, 7)
}

function mug(K: Kit, x: number, y: number, s: number, body: string) {
  const { ctx } = K
  const w = 60 * s
  const h = 70 * s
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.moveTo(x - w / 2, y - h)
  ctx.lineTo(x + w / 2, y - h)
  ctx.lineTo(x + w / 2 - 5 * s, y)
  ctx.lineTo(x - w / 2 + 5 * s, y)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = body
  ctx.lineWidth = 8 * s
  ctx.beginPath()
  ctx.arc(x + w / 2 + 2 * s, y - h * 0.5, 15 * s, -1.25, 1.25)
  ctx.stroke()
}

export default defineScene({
  cues: [2.0, 6.6, 11.2, 15.8],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)
    const step = t < WIN[1].a ? 0 : t < WIN[2].a ? 1 : 2
    K.stepper([L('s1'), L('s2'), L('s3')], step, outCubic(seg(t, 0.6, 1.1)), 1000)

    const qa = (w: { a: number }, q: string, a: string, verdict: string, y0 = 330) => {
      const u = t - w.a
      K.chip(L('you'), TX, y0 - 34, { size: 24, h: 44, pad: 14, k: outBack(seg(u, 0.1, 0.4)), bg: '#1D2C4A', fg: C.paper })
      const h = K.typeText(q, TX + 100, y0, seg(u, 0.3, 1.1), { size: 38, weight: 600, color: C.paper, maxW: 760 })
      const y1 = y0 + h + 60
      K.chip('VLM', TX, y1 - 34, { size: 24, h: 44, pad: 14, k: outBack(seg(u, 1.2, 1.5)), bg: C.visDeep, fg: C.vis })
      const h2 = K.typeText(a, TX + 100, y1, seg(u, 1.4, 2.2), { size: 38, weight: 600, color: C.gen, maxW: 760 })
      const y2 = y1 + h2 + 70
      const vk = seg(u, 2.4, 2.8)
      cross(K, TX + 22, y2 - 12, 18, vk)
      K.text(verdict, TX + 100, y2, { size: 36, weight: 600, fam: 'sans', color: C.warn, alpha: outCubic(seg(u, 2.6, 3.0)) })
    }

    // ── 1. hallucination ───────────────────────────────────────────────
    const p1 = presence(t, WIN[0].a, WIN[0].b)
    if (p1 > 0) {
      K.fade(p1, () => {
        const IMG = { x: 110, y: 250, s: 600 }
        photoAt(K, IMG.x, IMG.y, IMG.s, 14)
        K.strokeRR(IMG.x, IMG.y, IMG.s, IMG.s, 14, C.paper, 3)
        // the fork it "saw": a dashed ghost where one would usually be
        const gk = outExpo(seg(t, WIN[0].a + 2.2, WIN[0].a + 2.7))
        if (gk > 0) {
          const s = IMG.s / 1000
          // lying on the table, in front of the white mug
          const fx = IMG.x + (OBJ.mug1.x - 10) * s
          const fy = IMG.y + (OBJ.mug1.y + OBJ.mug1.h + 70) * s
          ctx.save()
          ctx.globalAlpha *= gk
          ctx.setLineDash([8, 7])
          K.strokeRR(fx, fy, 150 * s, 26 * s, 6, C.warn, 3)
          ctx.setLineDash([])
          K.text('?', fx + 75 * s, fy - 12, { size: 40, weight: 700, fam: 'display', color: C.warn, align: 'center' })
          ctx.restore()
        }
        qa(WIN[0], L('q1'), L('a1'), L('v1'))
        K.punch(L('c1'), t, WIN[0].a + 2.8, { x: 110, y: 960, size: 36, accent: C.gen })
      })
    }

    // ── 2. CLIP-blind: the photo and its mirror ─────────────────────────
    const p2 = presence(t, WIN[1].a, WIN[1].b)
    if (p2 > 0) {
      K.fade(p2, () => {
        const S = 380
        const u = t - WIN[1].a
        const ak = outExpo(seg(u, 0, 0.6))
        const bk = outExpo(seg(u, 0.2, 0.8))
        K.fade(ak, () => {
          photoAt(K, 110, 300, S, 14)
          K.strokeRR(110, 300, S, S, 14, C.paper, 3)
        })
        K.fade(bk, () => {
          ctx.save()
          ctx.translate(530 + S, 300)
          ctx.scale(-1, 1)
          photoAt(K, 0, 0, S, 14)
          ctx.restore()
          K.strokeRR(530, 300, S, S, 14, C.paper, 3)
        })
        K.label('A', 110, 280, { alpha: ak, color: C.dim })
        K.label('B', 530, 280, { alpha: bk, color: C.dim })
        // the same answer under both
        const r = outCubic(seg(u, 2.2, 2.6))
        K.text(L('a2'), 110, 730, { size: 30, weight: 600, fam: 'sans', color: C.gen, alpha: r })
        K.text(L('a2'), 530, 730, { size: 30, weight: 600, fam: 'sans', color: C.gen, alpha: r })
        K.text('✓', 110 + S - 10, 730, { size: 34, weight: 700, fam: 'sans', color: C.ok, align: 'right', alpha: outCubic(seg(u, 2.5, 2.8)) })
        cross(K, 530 + S - 22, 718, 13, seg(u, 2.5, 2.9))
        qa(WIN[1], L('q2'), L('a2'), L('v2'))
        K.punch(L('c2'), t, WIN[1].a + 2.8, { x: 110, y: 960, size: 36, accent: C.gen })
      })
    }

    // ── 3. counting ──────────────────────────────────────────────────
    const p3 = presence(t, WIN[2].a, WIN[2].b)
    if (p3 > 0) {
      K.fade(p3, () => {
        const u = t - WIN[2].a
        const X = 110
        const Y = 250
        const S = 600
        ctx.save()
        K.rr(X, Y, S, S, 14)
        ctx.clip()
        ctx.fillStyle = '#26324A'
        ctx.fillRect(X, Y, S, S)
        ctx.fillStyle = '#6B4E3A'
        ctx.fillRect(X, Y + S * 0.6, S, S * 0.4)
        ctx.fillStyle = '#8A674D'
        ctx.fillRect(X, Y + S * 0.6, S, 8)
        const cols = ['#EDE6D8', '#EE8A68', '#9FC3E6', '#EDE6D8', '#E9C46A', '#EE8A68', '#9FC3E6']
        const pos = [[90, 300], [200, 290], [310, 305], [420, 292], [520, 302], [150, 420], [380, 430]]
        pos.forEach(([mx, my], i) => {
          const k = outBack(seg(u, 0.2 + i * 0.07, 0.6 + i * 0.07))
          if (k <= 0) return
          ctx.save()
          ctx.globalAlpha *= Math.min(1, k * 2)
          mug(K, X + mx, Y + my + 60, 1.25 * (0.7 + 0.3 * k), cols[i])
          ctx.restore()
        })
        ctx.restore()
        K.strokeRR(X, Y, S, S, 14, C.paper, 3)
        qa(WIN[2], L('q3'), L('a3'), L('v3'))
        K.punch(L('c3'), t, WIN[2].a + 2.8, { x: 110, y: 960, size: 36, accent: C.gen })
      })
    }
    K.fade(outCubic(seg(t, 2.4, 2.9)), () => K.cite(L('cite')))
  },
})
