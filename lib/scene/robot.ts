/**
 * A stylised two-link arm, drawn side-on, for the VLM → VLA slide. Ported
 * from the VLA talk (github.com/Youngermaster/VLA-introduction-slides).
 * Every object is placed by its bottom-centre on the table line and returns
 * its bounding box, so detections, masks and grounding lines can find it.
 */
import { C, type Kit } from './kit'
import { clamp, lerp } from './math'

export type Box = { x: number; y: number; w: number; h: number }
export type Pt = { x: number; y: number }

/** Table surface: a bright top edge carries it — surfaces vanish on a projector. */
export function table(K: Kit, y: number, x0 = 120, x1 = 1800) {
  const { ctx } = K
  ctx.fillStyle = C.table
  ctx.fillRect(x0, y, x1 - x0, 30)
  ctx.fillStyle = C.faint
  ctx.fillRect(x0, y, x1 - x0, 4)
}

export interface ArmOpts {
  /** upper arm and forearm length */
  l1?: number
  l2?: number
  /** 0 = closed, 1 = fully open */
  grip?: number
  /** gripper rotation in radians; 0 = pointing straight down */
  tilt?: number
  body?: string
  accent?: string
  /** draw as a ghost (planning / imagined futures) */
  ghost?: number
}

/** Two-link IK, elbow-up. Returns the elbow for a wrist target. */
export function ik(shoulder: Pt, wrist: Pt, l1: number, l2: number): Pt {
  const dx = wrist.x - shoulder.x
  const dy = wrist.y - shoulder.y
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1, l1 + l2 - 1)
  const a = Math.atan2(dy, dx)
  const c = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1))
  const e1 = { x: shoulder.x + l1 * Math.cos(a + c), y: shoulder.y + l1 * Math.sin(a + c) }
  const e2 = { x: shoulder.x + l1 * Math.cos(a - c), y: shoulder.y + l1 * Math.sin(a - c) }
  return e1.y < e2.y ? e1 : e2
}

/** Where the jaws close, relative to the wrist — objects hang from here. */
export const GRIP_DROP = 128

/**
 * Draw the arm. `base` is the bottom-centre of the base plate on the table;
 * `wrist` is the wrist joint. Returns the joints (for overlays: joint angles,
 * the action-token strip, trails).
 */
export function arm(K: Kit, base: Pt, wrist: Pt, o: ArmOpts = {}) {
  const { ctx } = K
  const { l1 = 380, l2 = 340, grip = 1, tilt = 0, body = C.paper, accent = C.gen, ghost = 0 } = o
  const shoulder = { x: base.x, y: base.y - 96 }
  const elbow = ik(shoulder, wrist, l1, l2)
  ctx.save()
  if (ghost) ctx.globalAlpha *= ghost
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // base plate + turret
  if (!ghost) {
    K.fillRR(base.x - 92, base.y - 34, 184, 34, 8, '#16233D')
    K.fillRR(base.x - 50, base.y - 100, 100, 70, 12, '#24345A')
  }
  ctx.strokeStyle = body
  ctx.lineWidth = 42
  ctx.beginPath()
  ctx.moveTo(shoulder.x, shoulder.y)
  ctx.lineTo(elbow.x, elbow.y)
  ctx.stroke()
  ctx.lineWidth = 32
  ctx.beginPath()
  ctx.moveTo(elbow.x, elbow.y)
  ctx.lineTo(wrist.x, wrist.y)
  ctx.stroke()
  // gripper
  ctx.save()
  ctx.translate(wrist.x, wrist.y)
  ctx.rotate(tilt)
  const gap = lerp(34, 132, clamp(grip))
  ctx.lineWidth = 24
  ctx.beginPath()
  ctx.moveTo(0, -6)
  ctx.lineTo(0, 38)
  ctx.stroke()
  ctx.lineWidth = 18
  ctx.beginPath()
  ctx.moveTo(-gap / 2 - 8, 44)
  ctx.lineTo(gap / 2 + 8, 44)
  ctx.stroke()
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.moveTo(-gap / 2, 44)
  ctx.lineTo(-gap / 2 + 3, GRIP_DROP)
  ctx.moveTo(gap / 2, 44)
  ctx.lineTo(gap / 2 - 3, GRIP_DROP)
  ctx.stroke()
  ctx.restore()
  // joints: dark hub, paper ring, gold core: the actuators carry the output
  for (const [p, r] of [[shoulder, 32], [elbow, 26], [wrist, 21]] as const) {
    ctx.fillStyle = C.bg
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = body
    ctx.lineWidth = 6
    ctx.stroke()
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.arc(p.x, p.y, r * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  return { shoulder, elbow, wrist, tip: { x: wrist.x, y: wrist.y + GRIP_DROP } }
}

/** A cube: a generic object for the arm to pick. */
export function cube(K: Kit, x: number, y: number, color: string, s = 1): Box {
  const w = 96 * s
  K.fillRR(x - w / 2, y - w, w, w, 10 * s, color)
  return { x: x - w / 2, y: y - w, w, h: w }
}
