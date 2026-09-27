/**
 * The loop: see → think → act → see again. And why start from a VLM.
 *
 *   arrive  camera → VLA → action tokens → arm, and the way back: the camera
 *           sees what the arm did
 *   1 act    the loop runs a few times while the arm picks up the orange mug
 *   2 know   what the robot inherits from the web: "what could be an
 *            improvised hammer?" → the rock (RT-2), never taught with robot data
 *   3 who    RT-2, OpenVLA, SmolVLA: each one a VLM underneath
 */
import { defineScene } from '../lib/scene/types'
import { C, type Kit } from '../lib/scene/kit'
import { clamp, inOutCubic, lerp, outBack, outCubic, outExpo, path2, presence, seg } from '../lib/scene/math'
import { photoAt } from '../lib/scene/photo'
import { GRIP_DROP, arm, table } from '../lib/scene/robot'

const CAM = { x: 110, y: 270, s: 240 } // where the pipeline's photo always sits
const VLA = { x: 440, y: 300, w: 300, h: 180 }
const CHIP_X = 800
const CHIP_Y = 390
const TABLE_Y = 880
const BASE = { x: 1720, y: TABLE_Y }
const MUG_X = 1290
const REST = { x: 1450, y: 600 }
const ROCK_X = 1520
const T_ACT = 2.6

type P = { x: number; y: number }

function mug(K: Kit, x: number, y: number) {
  const { ctx } = K
  ctx.fillStyle = '#EE8A68'
  ctx.beginPath()
  ctx.moveTo(x - 42, y - 92)
  ctx.lineTo(x + 42, y - 92)
  ctx.lineTo(x + 36, y)
  ctx.lineTo(x - 36, y)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#EE8A68'
  ctx.lineWidth = 11
  ctx.beginPath()
  ctx.arc(x - 45, y - 46, 20, Math.PI - 1.25, Math.PI + 1.25)
  ctx.stroke()
}

function rock(K: Kit, x: number, y: number, k: number) {
  if (k <= 0) return
  const { ctx } = K
  ctx.save()
  ctx.globalAlpha *= clamp(k * 2)
  ctx.translate(x, y)
  ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k)
  ctx.fillStyle = '#8C939E'
  ctx.beginPath()
  ctx.moveTo(-54, 0)
  ctx.quadraticCurveTo(-60, -44, -18, -54)
  ctx.quadraticCurveTo(30, -64, 52, -30)
  ctx.quadraticCurveTo(64, -4, 50, 0)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** A point at fraction f (0..1) along a polyline. */
function along(pts: P[], f: number): P {
  const lens = [0]
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  const d = lens[lens.length - 1] * clamp(f)
  for (let i = 1; i < pts.length; i++) {
    if (d <= lens[i]) {
      const u = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1)
      return { x: lerp(pts[i - 1].x, pts[i].x, u), y: lerp(pts[i - 1].y, pts[i].y, u) }
    }
  }
  return pts[pts.length - 1]
}

const WRIST = (t: number) => path2(t, [
  [T_ACT, REST.x, REST.y],
  [T_ACT + 1.2, MUG_X + 10, TABLE_Y - GRIP_DROP - 150],
  [T_ACT + 1.9, MUG_X + 10, TABLE_Y - GRIP_DROP - 40],
  [T_ACT + 2.3, MUG_X + 10, TABLE_Y - GRIP_DROP - 40],
  [T_ACT + 3.4, REST.x - 20, REST.y - 30],
])

export default defineScene({
  cues: [2.2, 6.6, 10.4, 14.2],
  draw({ t, L, K, ctx }) {
    K.title(L('title'), t, 0.1)

    // ── the loop ──────────────────────────────────────────────────────
    const ck = outExpo(seg(t, 0.3, 1.0))
    K.fade(ck, () => {
      photoAt(K, CAM.x, CAM.y, CAM.s)
      K.strokeRR(CAM.x, CAM.y, CAM.s, CAM.s, 12, C.paper, 3)
    })
    K.label(L('cam'), CAM.x, CAM.y - 18, { alpha: ck })
    const vk = outExpo(seg(t, 0.5, 1.1))
    K.fade(vk, () => {
      K.fillRR(VLA.x, VLA.y, VLA.w, VLA.h, 16, C.table)
      K.text('VLA', VLA.x + VLA.w / 2, VLA.y + 84, { size: 60, weight: 700, fam: 'display', align: 'center' })
      K.text(L('inside'), VLA.x + VLA.w / 2, VLA.y + 132, { size: 24, weight: 500, fam: 'mono', color: C.mute, align: 'center' })
    })
    const mid = VLA.y + VLA.h / 2
    K.arrow(CAM.x + CAM.s + 14, mid, VLA.x - 14, mid, { color: C.mute, k: outCubic(seg(t, 0.9, 1.3)) })
    K.arrow(VLA.x + VLA.w + 14, mid, CHIP_X - 14, mid, { color: C.gen, k: outCubic(seg(t, 1.0, 1.4)) })
    let cx = CHIP_X
    ;['31887', '31866', '…'].forEach((s, i) => {
      const k = outBack(seg(t, 1.1 + i * 0.08, 1.5 + i * 0.08))
      if (s === '…') K.text(s, cx + 4, CHIP_Y + 10, { size: 32, fam: 'mono', color: C.gen, alpha: k })
      else cx += K.chip(s, cx, CHIP_Y - 24, { size: 24, h: 48, pad: 10, k, bg: C.genDeep, fg: C.gen }) + 8
    })
    const toArm = { a: { x: 1100, y: mid + 10 }, b: { x: REST.x - 40, y: REST.y - 80 } }
    K.arrow(toArm.a.x, toArm.a.y, toArm.b.x, toArm.b.y, { color: C.gen, k: outCubic(seg(t, 1.3, 1.7)), dash: [10, 8] })
    // the way back: the camera sees what the arm did
    const back = K.sample((u) => ({ x: lerp(1160, CAM.x + CAM.s / 2, u), y: lerp(640, CAM.y + CAM.s + 18, u) + Math.sin(u * Math.PI) * 50 }), 40)
    const bk = outCubic(seg(t, 1.4, 2.0))
    K.trace(back, bk, { color: C.paper, lw: 3, dash: [3, 10] })
    if (bk >= 1) K.arrow(back[37].x, back[37].y, back[40].x, back[40].y - 2, { color: C.paper, lw: 3 })
    K.text(L('back'), 620, 706, { size: 26, weight: 500, fam: 'mono', color: C.dim, alpha: outCubic(seg(t, 1.6, 2.0)) })

    // the world
    const wk = outCubic(seg(t, 0.8, 1.6))
    const wrist = WRIST(t)
    const lifted = t > T_ACT + 2.3
    K.fade(wk, () => {
      table(K, TABLE_Y, 1100, 1840)
      if (!lifted) mug(K, MUG_X, TABLE_Y)
      rock(K, ROCK_X, TABLE_Y, outBack(seg(t, 7.0, 7.4)))
      const tk = seg(t, T_ACT, T_ACT + 3.4)
      if (tk > 0) {
        const pts = K.sample((u) => {
          const p = WRIST(T_ACT + u * 3.4 * tk)
          return { x: p.x, y: p.y + GRIP_DROP }
        }, 90)
        K.trace(pts, 1, { color: C.gen, lw: 4, dash: [2, 12] })
      }
      arm(K, BASE, wrist, { l1: 300, l2: 280, grip: lerp(1, 0.55, inOutCubic(seg(t, T_ACT + 1.9, T_ACT + 2.3))), accent: C.gen })
      if (lifted) mug(K, wrist.x - 10, wrist.y + GRIP_DROP + 40)
    })

    // ── 1. pulses around the loop while it acts ────────────────────────
    const loopPts: P[] = [
      { x: CAM.x + CAM.s / 2, y: CAM.y + CAM.s / 2 }, { x: VLA.x + VLA.w / 2, y: mid }, { x: CHIP_X + 120, y: mid },
      toArm.a, toArm.b, ...back.slice(4),
    ]
    const lf = seg(t, T_ACT, T_ACT + 3.6)
    if (lf > 0 && lf < 1) {
      for (let c = 0; c < 3; c++) {
        const f = lf * 3 - c
        if (f > 0 && f < 1) K.dot(along(loopPts, f).x, along(loopPts, f).y, 11, f < 0.55 ? C.gen : C.paper)
      }
    }
    K.label(L('hz'), VLA.x, VLA.y + VLA.h + 44, { color: C.gen, size: 24, alpha: outCubic(seg(t, 3.0, 3.5)) })

    // ── 2. what it inherits from the web ───────────────────────────────
    const kA = presence(t, 6.8, 10.5)
    if (kA > 0) {
      K.fade(kA, () => {
        const u = t - 6.8
        K.chip(L('you'), 110, 830 - 34, { size: 24, h: 44, pad: 14, k: outBack(seg(u, 0.1, 0.4)), bg: '#1D2C4A', fg: C.paper })
        K.typeText(L('q'), 210, 830, seg(u, 0.3, 1.2), { size: 34, weight: 600, color: C.paper, maxW: 820 })
        K.chip('VLA', 110, 900 - 34, { size: 24, h: 44, pad: 14, k: outBack(seg(u, 1.3, 1.6)), bg: C.visDeep, fg: C.vis })
        K.typeText(L('a'), 210, 900, seg(u, 1.5, 2.0), { size: 34, weight: 600, color: C.gen, maxW: 820 })
        K.punch(L('know'), t, 8.9, { x: 110, y: 1000, size: 36, maxW: 1700 })
      })
    }
    // the arm answers too: a gold ring around the rock
    const rk = presence(t, 8.6, 10.5)
    if (rk > 0) K.fade(rk, () => K.strokeRR(ROCK_X - 70, TABLE_Y - 80, 140, 92, 16, C.gen, 4))

    // ── 3. who does this ──────────────────────────────────────────────
    ;[1, 2, 3].forEach((r, i) => {
      const y = 790 + i * 62
      const k = outExpo(seg(t, 10.7 + i * 0.25, 11.3 + i * 0.25))
      if (k <= 0) return
      ctx.save()
      ctx.globalAlpha *= clamp(k * 1.5)
      ctx.translate((1 - k) * -40, 0)
      K.text(L(`m${r}`), 110, y, { size: 30, weight: 700, fam: 'display', color: C.paper })
      K.text(L(`d${r}`), 470, y, { size: 28, weight: 500, fam: 'sans', color: C.dim })
      ctx.restore()
    })
    K.punch(L('punch'), t, 12.2, { y: 1005, size: 40 })
    K.fade(outCubic(seg(t, 3.0, 3.5)), () => K.cite(t < 10.5 ? L('cite') : L('cite2')))
  },
})
