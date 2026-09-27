/**
 * CLIP: learning to see by reading.
 *
 *   arrive  four pictures down the side, four captions across the top
 *   1 match the similarity grid fills: the diagonal (right pairs) lights up,
 *           everything else stays dark. Pull the right pairs, push the rest.
 *   2 scale 400 M pairs from the internet, 32 768 at a time
 *   3 zero  the grid clears for a new photo: compare it with every caption,
 *           no labels, no training on the task. The mugs win.
 */
import { defineScene } from '../lib/scene/types'
import { C } from '../lib/scene/kit'
import { alpha, hash, outBack, outCubic, outExpo, presence, seg } from '../lib/scene/math'
import { photoAt, thumb, type Thumb } from '../lib/scene/photo'

const KINDS: Thumb[] = ['cat', 'bike', 'mountain', 'table']
const MX = 420
const MY = 310
const CW = 160 // cell width: captions need the room
const CH = 138
const PX_ = 172
const PY_ = 150
const TH = 116

export default defineScene({
  cues: [2.2, 5.8, 9.2, 13.4],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)
    const caps = L('caps').split('|')
    const gridA = 1 - outCubic(seg(t, 9.4, 9.9))

    // ── the grid: pictures × captions ──────────────────────────────────
    K.fade(gridA, () => {
      KINDS.forEach((kind, r) => {
        const k = outBack(seg(t, 0.4 + r * 0.08, 0.8 + r * 0.08))
        if (k <= 0) return
        ctx.save()
        ctx.globalAlpha *= Math.min(1, k * 2)
        const y = MY + r * PY_ + (CH - TH) / 2
        const x = MX - TH - 36
        ctx.translate(x + TH / 2, y + TH / 2)
        ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k)
        thumb(K, kind, -TH / 2, -TH / 2, TH)
        ctx.restore()
      })
      caps.forEach((c, i) => {
        const a = outExpo(seg(t, 0.8 + i * 0.08, 1.3 + i * 0.08))
        K.text(c, MX + i * PX_ + CW / 2, MY - 26, { size: 23, weight: 500, fam: 'mono', color: C.paper, align: 'center', alpha: a })
      })
      const fill = seg(t, 2.4, 3.6)
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const x = MX + c * PX_
          const y = MY + r * PY_
          const base = outCubic(seg(t, 1.0 + (r + c) * 0.05, 1.5 + (r + c) * 0.05))
          ctx.strokeStyle = alpha(C.paper, 0.14 * base)
          ctx.lineWidth = 1.5
          ctx.strokeRect(x + 1, y + 1, CW - 2, CH - 2)
          const k = outCubic(seg(fill, (r + c) * 0.08, (r + c) * 0.08 + 0.5))
          if (k <= 0) continue
          const sim = r === c ? 0.95 : 0.06 + hash(r, c) * 0.14
          ctx.fillStyle = alpha(C.vis, sim * k)
          ctx.fillRect(x + 4, y + 4, CW - 8, CH - 8)
          if (r === c) {
            const dk = outCubic(seg(t, 3.8, 4.3))
            if (dk > 0) K.strokeRR(x, y, CW, CH, 6, alpha(C.paper, dk), 4)
          }
        }
      }
    })

    // ── 1. pull / push ─────────────────────────────────────────────────
    const RX = MX + 4 * PX_ + 80
    const pk = outCubic(seg(t, 4.2, 4.7)) * gridA
    K.text(L('pull'), RX, MY + 50, { size: 38, weight: 600, fam: 'sans', color: C.paper, alpha: pk })
    K.text(L('push'), RX, MY + 110, { size: 38, weight: 600, fam: 'sans', color: C.mute, alpha: outCubic(seg(t, 4.5, 5.0)) * gridA })

    // ── 2. the scale ──────────────────────────────────────────────────
    const sk = outExpo(seg(t, 6.0, 6.6)) * gridA
    if (sk > 0) {
      K.text(`${K.count(0, 400, seg(t, 6.0, 7.6))} M`, RX, MY + 330, { size: 150, weight: 700, fam: 'display', color: C.vis, alpha: sk })
      K.text(L('pairs'), RX + 4, MY + 392, { size: 36, weight: 600, fam: 'sans', color: C.paper, alpha: sk })
      K.text(L('batch'), RX + 4, MY + 444, { size: 26, weight: 500, fam: 'mono', color: C.mute, alpha: outCubic(seg(t, 7.6, 8.1)) * gridA })
    }

    // ── 3. zero-shot: a new photo against every caption ─────────────────
    const zk = outExpo(seg(t, 10.0, 10.8))
    const PX = 160
    const PY = 300
    const PS = 420
    if (zk > 0) {
      K.fade(zk, () => {
        ctx.save()
        ctx.translate((1 - zk) * -60, 0)
        photoAt(K, PX, PY, PS, 14)
        K.strokeRR(PX, PY, PS, PS, 14, C.paper, 3)
        ctx.restore()
      })
      K.label(L('new'), PX, PY - 20, { alpha: zk })
    }
    const probs = [0.02, 0.01, 0.03, 0.94]
    const BX = 760
    const BW = 760
    caps.forEach((c, i) => {
      const y = PY + 20 + i * 100
      const a = presence(t, 10.3 + i * 0.08)
      if (a <= 0) return
      const win = i === 3
      K.text(`${L('prompt')} ${c}`, BX, y + 4, { size: 30, weight: 500, fam: 'mono', color: win ? C.gen : C.dim, alpha: a })
      const k = outExpo(seg(t, 11.0 + i * 0.1, 12.2 + i * 0.1))
      const w = Math.max(6, BW * probs[i] * k)
      K.fillRR(BX, y + 24, w, 34, 6, win ? C.gen : alpha(C.vis, 0.7))
      K.text(`${Math.round(probs[i] * 100 * k)} %`, BX + w + 16, y + 52, { size: 26, weight: 600, fam: 'mono', color: win ? C.gen : C.mute, alpha: a * outCubic(seg(t, 11.2, 11.6)) })
    })
    K.punch(L('punch'), t, 12.3, { y: 900, size: 42, maxW: 1700 })
    K.fade(outCubic(seg(t, 6.0, 6.5)), () => K.cite(L('cite')))
  },
})
