/**
 * From VLM to robot: the same model, a different output.
 *
 *   arrive  photo + question → VLM → gold words, the pipeline from the talk
 *   1 swap   the question becomes an instruction, and the words become seven
 *            numbers: an action (six joint deltas and the gripper)
 *   2 act    those numbers drive an arm: it picks up the orange mug
 *   3 who    RT-2, OpenVLA, SmolVLA: each one a VLM underneath
 */
import { defineScene } from '../lib/scene/types'
import { C, type Kit } from '../lib/scene/kit'
import { clamp, inOutCubic, lerp, outBack, outCubic, outExpo, path2, presence, seg } from '../lib/scene/math'
import { photoAt } from '../lib/scene/photo'
import { GRIP_DROP, arm, table } from '../lib/scene/robot'

const IMG = { x: 110, y: 250, s: 220 }
const VLM = { x: 420, y: 250, w: 340, h: 220 }
const OUT_X = 830
const OUT_Y = 360
const TABLE_Y = 900
const BASE = { x: 1700, y: TABLE_Y }
const MUG_X = 1250
const REST = { x: 1420, y: 640 }

function mug(K: Kit, x: number, y: number, s = 1) {
  const { ctx } = K
  const w = 84 * s
  const h = 92 * s
  ctx.fillStyle = '#EE8A68'
  ctx.beginPath()
  ctx.moveTo(x - w / 2, y - h)
  ctx.lineTo(x + w / 2, y - h)
  ctx.lineTo(x + w / 2 - 6, y)
  ctx.lineTo(x - w / 2 + 6, y)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#EE8A68'
  ctx.lineWidth = 11 * s
  ctx.beginPath()
  ctx.arc(x - w / 2 - 3, y - h * 0.5, 20 * s, Math.PI - 1.25, Math.PI + 1.25)
  ctx.stroke()
}

export default defineScene({
  cues: [2.2, 5.8, 10.2, 13.8],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)

    // ── the pipeline ───────────────────────────────────────────────────
    const pk = outExpo(seg(t, 0.3, 1.0))
    K.fade(pk, () => {
      photoAt(K, IMG.x, IMG.y, IMG.s)
      K.strokeRR(IMG.x, IMG.y, IMG.s, IMG.s, 12, C.paper, 3)
    })
    const inA = presence(t, 0.6, 2.6)
    const inB = presence(t, 2.8)
    K.chip(L('q'), IMG.x, IMG.y + IMG.s + 22, { size: 24, h: 44, pad: 12, k: inA, bg: '#1D2C4A', fg: C.paper })
    K.chip(L('instr'), IMG.x, IMG.y + IMG.s + 22, { size: 24, h: 44, pad: 12, k: inB, bg: '#1D2C4A', fg: C.paper })
    const vk = outExpo(seg(t, 0.6, 1.2))
    K.fade(vk, () => {
      K.fillRR(VLM.x, VLM.y, VLM.w, VLM.h, 16, C.table)
      K.text('VLM', VLM.x + VLM.w / 2, VLM.y + VLM.h / 2 + 4, { size: 64, weight: 700, fam: 'display', color: C.paper, align: 'center', base: 'middle' })
    })
    const mid = VLM.y + VLM.h / 2
    K.arrow(IMG.x + IMG.s + 14, mid, VLM.x - 14, mid, { color: C.mute, k: outCubic(seg(t, 1.0, 1.4)) })
    K.arrow(VLM.x + VLM.w + 14, mid, OUT_X - 16, mid, { color: C.mute, k: outCubic(seg(t, 1.2, 1.6)) })

    // words, then actions
    const wOut = 1 - outCubic(seg(t, 2.5, 2.8))
    let x = OUT_X
    L('words').split('|').forEach((w, i) => {
      const k = outBack(seg(t, 1.4 + i * 0.12, 1.8 + i * 0.12)) * wOut
      x += K.chip(w, x, OUT_Y - 28, { size: 30, h: 56, pad: 14, k, bg: C.genDeep, fg: C.gen }) + 10
    })
    const nums = ['+0.12', '−0.04', '+0.31', '0.00', '+0.08', '−0.02', '1']
    const labs = ['Δx', 'Δy', 'Δz', 'Δα', 'Δβ', 'Δγ', L('grip')]
    const AW = 124
    nums.forEach((n, i) => {
      const k = seg(t, 3.0 + i * 0.1, 3.4 + i * 0.1)
      K.chip(n, OUT_X + i * (AW + 8), OUT_Y - 28, { size: 28, h: 56, pad: 12, k: outBack(k), bg: C.genDeep, fg: C.gen })
      K.text(labs[i], OUT_X + i * (AW + 8) + 14, OUT_Y + 64, { size: 24, weight: 500, fam: 'mono', color: C.mute, alpha: outCubic(seg(t, 3.6 + i * 0.05, 4.0 + i * 0.05)) })
    })
    K.text(L('same'), OUT_X, OUT_Y - 66, { size: 26, weight: 500, fam: 'mono', color: C.gen, alpha: outCubic(seg(t, 4.2, 4.7)) })

    // ── 2. the arm acts ────────────────────────────────────────────────
    const sk = outCubic(seg(t, 5.9, 6.4))
    const T0 = 6.3
    const wrist = path2(t, [
      [T0, REST.x, REST.y],
      [T0 + 1.3, MUG_X + 10, TABLE_Y - GRIP_DROP - 150],
      [T0 + 2.0, MUG_X + 10, TABLE_Y - GRIP_DROP - 40],
      [T0 + 2.5, MUG_X + 10, TABLE_Y - GRIP_DROP - 40],
      [T0 + 3.4, REST.x - 20, REST.y - 40],
    ])
    const grip = lerp(1, 0.55, inOutCubic(seg(t, T0 + 2.0, T0 + 2.4)))
    const lifted = t > T0 + 2.4
    K.fade(sk, () => {
      table(K, TABLE_Y, 960, 1840)
      if (!lifted) mug(K, MUG_X, TABLE_Y)
      // the tip's trajectory, drawn as it moves
      const tk = seg(t, T0, T0 + 3.4)
      if (tk > 0) {
        const pts = K.sample((u) => {
          const p = path2(T0 + u * 3.4 * tk, [
            [T0, REST.x, REST.y],
            [T0 + 1.3, MUG_X + 10, TABLE_Y - GRIP_DROP - 150],
            [T0 + 2.0, MUG_X + 10, TABLE_Y - GRIP_DROP - 40],
            [T0 + 2.5, MUG_X + 10, TABLE_Y - GRIP_DROP - 40],
            [T0 + 3.4, REST.x - 20, REST.y - 40],
          ])
          return { x: p.x, y: p.y + GRIP_DROP }
        }, 90)
        K.trace(pts, 1, { color: C.gen, lw: 4, dash: [2, 12] })
      }
      arm(K, BASE, wrist, { l1: 300, l2: 280, grip, accent: C.gen })
      if (lifted) mug(K, wrist.x - 10, wrist.y + GRIP_DROP + 40)
    })
    // the numbers flow to the arm
    const fk = outCubic(seg(t, 5.9, 6.4))
    if (fk > 0) K.arrow(OUT_X + 5 * (AW + 8) + 30, OUT_Y + 100, REST.x - 10, REST.y - 70, { color: C.gen, lw: 3, k: fk, dash: [10, 8] })
    K.text(L('hz'), OUT_X, OUT_Y + 120, { size: 26, weight: 500, fam: 'mono', color: C.gen, alpha: outCubic(seg(t, 6.4, 6.9)) })

    // ── 3. who does this ──────────────────────────────────────────────
    const rows = [1, 2, 3]
    rows.forEach((r, i) => {
      const y = 640 + i * 110
      const k = outExpo(seg(t, 10.4 + i * 0.25, 11.0 + i * 0.25))
      if (k <= 0) return
      ctx.save()
      ctx.globalAlpha *= clamp(k * 1.5)
      ctx.translate((1 - k) * -40, 0)
      K.text(L(`m${r}`), 110, y, { size: 36, weight: 700, fam: 'display', color: C.paper })
      K.text(L(`d${r}`), 110, y + 42, { size: 28, weight: 500, fam: 'sans', color: C.dim })
      ctx.restore()
    })
    K.punch(L('punch'), t, 11.8, { y: 1000, size: 40 })
    K.fade(outCubic(seg(t, 10.4, 10.9)), () => K.cite(L('cite')))
  },
})
