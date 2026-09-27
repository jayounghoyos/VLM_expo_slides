/**
 * How does it answer?
 *
 *   arrive  title, the photo, the input row: 16 image patches + the question
 *   1 look  the word "mugs" attends to every token; the weight lands on the
 *           patches where the two mugs are (computed from the photo's boxes)
 *   2 say   the answer comes out one token at a time, each fed back in
 *   3 mask  who may look at whom: image + question see each other fully,
 *           the answer only looks back (PaliGemma's prefix-LM mask)
 */
import { defineScene } from '../lib/scene/types'
import { C } from '../lib/scene/kit'
import { alpha, clamp, inOutCubic, lerp, outBack, outCubic, outExpo, seg } from '../lib/scene/math'
import { cover, patch, photoAt } from '../lib/scene/photo'

const IMG = { x: 110, y: 230, s: 400 }
const G = 4 // the photo, downsampled to 4 × 4 patches for the row
const HG = 8 // finer grid for the heatmap on the photo
const ROW_Y = 770
const TILE = 50
const TGAP = 6
const MUGS = ['mug1', 'mug2'] as const

/** attention weight from the query word to image patch (i, j) of a g × g grid */
const wImg = (i: number, j: number, g: number) => 0.05 + 0.95 * clamp(cover(i, j, g, MUGS) * 3.2)

export default defineScene({
  cues: [2.2, 5.6, 9.4, 12.8],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1, { tout: 11.9 })

    // ── the photo, with heat ───────────────────────────────────────────
    const ik = outExpo(seg(t, 0.4, 1.2))
    const heat = outCubic(seg(t, 3.3, 4.3))
    if (ik > 0) {
      K.fade(ik, () => {
        photoAt(K, IMG.x, IMG.y, IMG.s)
        const P = IMG.s / HG
        for (let j = 0; j < HG; j++) {
          for (let i = 0; i < HG; i++) {
            if (heat > 0) {
              const w = wImg(i, j, HG)
              ctx.fillStyle = alpha(C.vis, heat * (w > 0.2 ? 0.2 + 0.5 * w : 0.0))
              ctx.fillRect(IMG.x + i * P, IMG.y + j * P, P, P)
              ctx.fillStyle = alpha(C.bg, heat * (w > 0.2 ? 0 : 0.45))
              ctx.fillRect(IMG.x + i * P, IMG.y + j * P, P, P)
            }
            ctx.strokeStyle = alpha(C.vis, 0.22)
            ctx.lineWidth = 1
            ctx.strokeRect(IMG.x + i * P, IMG.y + j * P, P, P)
          }
        }
        K.strokeRR(IMG.x, IMG.y, IMG.s, IMG.s, 12, C.paper, 3)
      })
      K.label(L('cam'), IMG.x, IMG.y - 18, { alpha: ik })
    }

    // ── the input row: 16 patches, then the question ───────────────────
    const words = L('q').split('|')
    const qi = Number(L('qi'))
    const wW = words.map((s) => K.measure(s, 28, 500, 'mono') + 28)
    type Tok = { x: number; w: number; kind: 'img' | 'txt'; i?: number; j?: number; label?: string; wq: number }
    const toks: Tok[] = []
    let x = IMG.x
    for (let n = 0; n < G * G; n++) {
      const i = n % G
      const j = Math.floor(n / G)
      toks.push({ x, w: TILE, kind: 'img', i, j, wq: wImg(i, j, G) })
      x += TILE + TGAP
    }
    x += 22
    words.forEach((s, n) => {
      toks.push({ x, w: wW[n], kind: 'txt', label: s, wq: n === qi ? 0 : 0.12 })
      x += wW[n] + 10
    })
    const rowEnd = x - 10
    const q = toks[G * G + qi]
    const selfDim = lerp(1, 0.4, outCubic(seg(t, 5.7, 6.2))) * lerp(1, 0.5, outCubic(seg(t, 9.5, 10.0)))

    // self-attention arcs from the query word
    const arcK = seg(t, 2.6, 3.9)
    if (arcK > 0) {
      const qx = q.x + q.w / 2
      const top = ROW_Y - 34
      toks.forEach((tk, n) => {
        if (tk === q) return
        const k = inOutCubic(seg(arcK, (n / toks.length) * 0.5, (n / toks.length) * 0.5 + 0.5))
        if (k <= 0) return
        const tx = tk.x + tk.w / 2
        const lift = Math.min(40 + Math.abs(qx - tx) * 0.22, 150)
        const pts = K.sample((u) => ({ x: lerp(qx, tx, u), y: top - Math.sin(u * Math.PI) * lift }), 36)
        ctx.save()
        ctx.globalAlpha *= (0.2 + 0.8 * tk.wq) * selfDim
        K.trace(pts, k, { color: C.vis, lw: 1.5 + tk.wq * 9 })
        ctx.restore()
      })
    }

    toks.forEach((tk, n) => {
      const k = outBack(seg(t, 0.9 + n * 0.035, 1.3 + n * 0.035))
      if (k <= 0) return
      ctx.save()
      ctx.globalAlpha *= clamp(k * 2)
      if (tk.kind === 'img') {
        const s = 0.6 + 0.4 * k
        patch(K, tk.i!, tk.j!, G, tk.x + (TILE - TILE * s) / 2, ROW_Y - (TILE * s) / 2, TILE * s, TILE * s)
        const hk = heat * tk.wq
        ctx.strokeStyle = hk > 0.3 ? C.vis : alpha(C.vis, 0.45)
        ctx.lineWidth = hk > 0.3 ? 4 : 1.5
        ctx.strokeRect(tk.x, ROW_Y - TILE / 2, TILE, TILE)
      }
      else {
        const on = tk === q ? outCubic(seg(t, 2.3, 2.6)) : 0
        K.chip(tk.label!, tk.x, ROW_Y - 28, { size: 28, h: 56, pad: 14, k, bg: '#1D2C4A', fg: C.paper, stroke: on > 0.5 ? C.vis : undefined })
      }
      ctx.restore()
    })
    const qk = outExpo(seg(t, 2.4, 2.8))
    if (qk > 0) K.text('Q', q.x + q.w / 2, ROW_Y - 48, { size: 30, weight: 700, fam: 'display', color: C.vis, align: 'center', alpha: qk * selfDim })
    K.punch(L('look'), t, 4.3, { x: IMG.x, y: ROW_Y + 100, size: 34, maxW: 1500, accent: C.vis, tout: 5.7 })

    // ── 2. the answer, one token at a time ─────────────────────────────
    const ans = L('a').split('|')
    let gx = rowEnd + 44
    const slots: { x: number; w: number }[] = []
    ans.forEach((s) => {
      const w = K.measure(s, 28, 500, 'mono') + 28
      slots.push({ x: gx, w })
      gx += w + 12
    })
    ans.forEach((s, i) => {
      const t0 = 6.0 + i * 0.9
      if (i > 0) {
        // feedback arc: the previous word goes back in before the next comes out
        const a = slots[i - 1]
        const b = slots[i]
        const k = inOutCubic(seg(t, t0 - 0.45, t0 - 0.05))
        const pts = K.sample((u) => ({ x: lerp(a.x + a.w / 2, b.x + b.w / 2, u), y: ROW_Y + 34 + Math.sin(u * Math.PI) * 44 }), 24)
        K.trace(pts, k, { color: C.gen, lw: 2.5 })
      }
      const k = seg(t, t0, t0 + 0.4)
      K.chip(s, slots[i].x, ROW_Y - 28, { size: 28, h: 56, pad: 14, k: outBack(k), bg: C.genDeep, fg: C.gen })
    })
    const genLab = outCubic(seg(t, 6.2, 6.7))
    K.text(L('gen'), slots[0].x, ROW_Y - 70, { size: 24, weight: 500, fam: 'mono', color: C.gen, alpha: genLab })
    K.punch(L('gen_punch'), t, 8.4, { x: IMG.x, y: ROW_Y + 100, size: 34, maxW: 1500, tout: 9.5 })

    // ── 3. the mask ───────────────────────────────────────────────────
    const groups = [
      { n: 4, label: L('m_img'), color: C.vis },
      { n: 3, label: L('m_q'), color: C.paper },
      { n: 3, label: L('m_a'), color: C.gen },
    ]
    const NM = groups.reduce((a, g) => a + g.n, 0)
    const PRE = 7
    const CELLS = 36
    const MX = 1400
    const MY = 240
    const mk = seg(t, 9.7, 11.3)
    if (mk > 0) {
      for (let r = 0; r < NM; r++) {
        for (let c = 0; c < NM; c++) {
          const on = r < PRE ? c < PRE : c <= r
          const k = outCubic(seg(mk, (r / NM) * 0.7, (r / NM) * 0.7 + 0.3))
          if (k <= 0) continue
          const x0 = MX + c * CELLS
          const y0 = MY + r * CELLS
          if (on) {
            ctx.fillStyle = r < PRE ? alpha(C.vis, 0.85 * k) : alpha(C.gen, 0.9 * k)
            ctx.fillRect(x0 + 2, y0 + 2, CELLS - 4, CELLS - 4)
          }
          else {
            ctx.strokeStyle = alpha(C.paper, 0.2 * k)
            ctx.lineWidth = 1.5
            ctx.strokeRect(x0 + 3, y0 + 3, CELLS - 6, CELLS - 6)
          }
        }
      }
      let gy = MY
      groups.forEach((g, gi) => {
        const a = outCubic(seg(t, 9.8 + gi * 0.12, 10.2 + gi * 0.12))
        K.text(g.label, MX - 16, gy + (g.n * CELLS) / 2 + 8, { size: 22, weight: 500, fam: 'mono', color: g.color, align: 'right', alpha: a })
        gy += g.n * CELLS
      })
    }
    const lg = outCubic(seg(t, 11.2, 11.7))
    if (lg > 0) {
      const lx = 600
      K.text(L('m_rows'), lx, 300, { size: 24, weight: 500, fam: 'mono', color: C.mute, alpha: lg })
      ctx.fillStyle = alpha(C.vis, 0.85 * lg)
      ctx.fillRect(lx, 350, 30, 30)
      K.text(L('m_prefix'), lx + 48, 374, { size: 30, weight: 600, fam: 'sans', color: C.paper, alpha: lg })
      ctx.fillStyle = alpha(C.gen, 0.9 * lg)
      ctx.fillRect(lx, 420, 30, 30)
      K.text(L('m_causal'), lx + 48, 444, { size: 30, weight: 600, fam: 'sans', color: C.paper, alpha: lg })
    }
    K.punch(L('punch'), t, 12.0, { y: 138, maxW: 1750, size: 46 })
    K.fade(outCubic(seg(t, 9.8, 10.3)), () => K.cite(L('cite')))
  },
})
