/**
 * The running example: one photo, drawn in code, that the whole talk looks at.
 * A table by a window with two mugs, an apple, a laptop and a plant. The
 * thread question is "how many mugs are there?", so the two mugs are the
 * objects attention has to find, and the other three are the distractors.
 *
 * Everything is drawn in a 1000 × 1000 box. Scenes place it with `photoAt`,
 * cut it with `patch`, and ask how much of a patch an object covers with
 * `cover`, which is how attention heatmaps land on the right patches without
 * hand-tuned tables.
 *
 * Also here: the tiny thumbnails the CLIP slide pairs with captions.
 */
import type { Kit } from './kit'
import { clamp } from './math'

export type Box = { x: number; y: number; w: number; h: number }

/** Object boxes in the 1000 × 1000 photo space. */
export const OBJ = {
  plant: { x: 50, y: 330, w: 190, h: 330 },
  laptop: { x: 250, y: 400, w: 300, h: 255 },
  mug1: { x: 575, y: 540, w: 125, h: 125 },
  apple: { x: 735, y: 585, w: 85, h: 85 },
  mug2: { x: 845, y: 545, w: 125, h: 120 },
} as const satisfies Record<string, Box>
export type ObjName = keyof typeof OBJ

const TABLE_Y = 640

function mugShape(K: Kit, b: Box, body: string, band: string) {
  const { ctx } = K
  const hw = b.w * 0.4
  const cx = b.x + b.w * 0.42
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.moveTo(cx - hw, b.y)
  ctx.lineTo(cx + hw, b.y)
  ctx.lineTo(cx + hw - 8, b.y + b.h)
  ctx.lineTo(cx - hw + 8, b.y + b.h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = band
  ctx.fillRect(cx - hw + 3, b.y + b.h * 0.3, hw * 2 - 6, b.h * 0.16)
  ctx.strokeStyle = body
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(cx + hw + 4, b.y + b.h * 0.5, 26, -1.25, 1.25)
  ctx.stroke()
  // coffee surface, seen slightly from above
  ctx.fillStyle = '#3B2618'
  ctx.beginPath()
  ctx.ellipse(cx, b.y + 4, hw - 6, 9, 0, 0, Math.PI * 2)
  ctx.fill()
}

/** Paint the photo into the current transform's 0..1000 box. */
export function photo(K: Kit) {
  const { ctx } = K
  // wall
  ctx.fillStyle = '#26324A'
  ctx.fillRect(0, 0, 1000, 1000)
  // window, upper right: gives every patch something different to encode
  ctx.fillStyle = '#5C7BA6'
  ctx.fillRect(560, 70, 360, 300)
  ctx.fillStyle = '#8FB0D8'
  ctx.fillRect(580, 90, 150, 260)
  ctx.fillRect(750, 90, 150, 260)
  const g = ctx.createRadialGradient(740, 220, 30, 740, 220, 700)
  g.addColorStop(0, 'rgba(255,236,200,0.22)')
  g.addColorStop(1, 'rgba(255,236,200,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1000, 1000)
  // table
  ctx.fillStyle = '#6B4E3A'
  ctx.fillRect(0, TABLE_Y, 1000, 360)
  ctx.fillStyle = '#8A674D'
  ctx.fillRect(0, TABLE_Y, 1000, 12)
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  for (let i = 0; i < 5; i++) ctx.fillRect(0, TABLE_Y + 60 + i * 64, 1000, 3)

  // plant: pot + leaves
  const pl = OBJ.plant
  ctx.fillStyle = '#C8734F'
  ctx.beginPath()
  ctx.moveTo(pl.x + 40, pl.y + 200)
  ctx.lineTo(pl.x + 150, pl.y + 200)
  ctx.lineTo(pl.x + 135, pl.y + pl.h)
  ctx.lineTo(pl.x + 55, pl.y + pl.h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#4F9A5E'
  const leaves: [number, number, number, number][] = [[95, 110, 0.5, 70], [60, 150, -0.6, 64], [135, 150, 0.7, 64], [95, 40, 0.05, 60], [45, 80, -0.9, 52], [150, 75, 0.9, 52]]
  for (const [lx, ly, rot, len] of leaves) {
    ctx.save()
    ctx.translate(pl.x + lx, pl.y + ly)
    ctx.rotate(rot)
    ctx.beginPath()
    ctx.ellipse(0, 0, 22, len, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // laptop: open, screen facing us
  const lp = OBJ.laptop
  K.fillRR(lp.x + 20, lp.y, lp.w - 40, 200, 10, '#1B1F27')
  K.fillRR(lp.x + 32, lp.y + 12, lp.w - 64, 176, 6, '#3E6FB0')
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  for (let i = 0; i < 4; i++) ctx.fillRect(lp.x + 52, lp.y + 36 + i * 30, 120 + ((i * 53) % 90), 10)
  ctx.fillStyle = '#AEB6C4'
  ctx.beginPath()
  ctx.moveTo(lp.x + 20, lp.y + 205)
  ctx.lineTo(lp.x + lp.w - 20, lp.y + 205)
  ctx.lineTo(lp.x + lp.w, lp.y + lp.h)
  ctx.lineTo(lp.x, lp.y + lp.h)
  ctx.closePath()
  ctx.fill()

  // the two mugs: the answer
  mugShape(K, OBJ.mug1, '#EDE6D8', '#C9BBA2')
  mugShape(K, OBJ.mug2, '#EE8A68', '#C9603F')

  // apple
  const ap = OBJ.apple
  ctx.fillStyle = '#D23F31'
  ctx.beginPath()
  ctx.arc(ap.x + ap.w * 0.36, ap.y + ap.h * 0.56, ap.w * 0.36, 0, Math.PI * 2)
  ctx.arc(ap.x + ap.w * 0.64, ap.y + ap.h * 0.56, ap.w * 0.36, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#5A3B24'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(ap.x + ap.w / 2, ap.y + ap.h * 0.22)
  ctx.lineTo(ap.x + ap.w / 2 + 4, ap.y)
  ctx.stroke()
  ctx.fillStyle = '#4F9A5E'
  ctx.beginPath()
  ctx.ellipse(ap.x + ap.w / 2 + 18, ap.y + 8, 14, 7, -0.5, 0, Math.PI * 2)
  ctx.fill()
}

/** Draw the whole photo into the rect (x, y, s × s), clipped with rounded corners. */
export function photoAt(K: Kit, x: number, y: number, s: number, r = 12) {
  const { ctx } = K
  ctx.save()
  K.rr(x, y, s, s, r)
  ctx.clip()
  ctx.translate(x, y)
  ctx.scale(s / 1000, s / 1000)
  photo(K)
  ctx.restore()
}

/** Draw patch (i, j) of an n × n grid over the photo into the rect (x, y, w, h). */
export function patch(K: Kit, i: number, j: number, n: number, x: number, y: number, w: number, h: number) {
  const { ctx } = K
  const p = 1000 / n
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.translate(x, y)
  ctx.scale(w / p, h / p)
  ctx.translate(-i * p, -j * p)
  photo(K)
  ctx.restore()
}

/** Fraction (0..1) of patch (i, j) in an n × n grid covered by the given objects. */
export function cover(i: number, j: number, n: number, names: readonly ObjName[]) {
  const p = 1000 / n
  const px = i * p
  const py = j * p
  let a = 0
  for (const nm of names) {
    const b = OBJ[nm]
    const w = Math.max(0, Math.min(px + p, b.x + b.w) - Math.max(px, b.x))
    const h = Math.max(0, Math.min(py + p, b.y + b.h) - Math.max(py, b.y))
    a += w * h
  }
  return clamp(a / (p * p))
}

/* ── thumbnails for the CLIP slide ─────────────────────────────────────── */

export type Thumb = 'table' | 'cat' | 'bike' | 'mountain'

/** A small square picture: the running photo, or one of three simple scenes. */
export function thumb(K: Kit, kind: Thumb, x: number, y: number, s: number) {
  const { ctx } = K
  if (kind === 'table') return photoAt(K, x, y, s, 10)
  ctx.save()
  K.rr(x, y, s, s, 10)
  ctx.clip()
  ctx.translate(x, y)
  ctx.scale(s / 100, s / 100)
  if (kind === 'cat') {
    ctx.fillStyle = '#3A4A66'
    ctx.fillRect(0, 0, 100, 100)
    ctx.fillStyle = '#6B4E3A'
    ctx.fillRect(0, 76, 100, 24)
    ctx.fillStyle = '#E9A25B'
    ctx.beginPath()
    ctx.ellipse(52, 66, 26, 16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(34, 46, 15, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(22, 40); ctx.lineTo(24, 24); ctx.lineTo(33, 34)
    ctx.moveTo(46, 40); ctx.lineTo(44, 24); ctx.lineTo(35, 34)
    ctx.fill()
    ctx.strokeStyle = '#E9A25B'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(76, 70)
    ctx.quadraticCurveTo(92, 60, 86, 44)
    ctx.stroke()
  }
  else if (kind === 'bike') {
    ctx.fillStyle = '#7FA7D6'
    ctx.fillRect(0, 0, 100, 100)
    ctx.fillStyle = '#5E7F5A'
    ctx.fillRect(0, 74, 100, 26)
    ctx.strokeStyle = '#1B1F27'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(28, 64, 15, 0, Math.PI * 2)
    ctx.moveTo(87, 64)
    ctx.arc(72, 64, 15, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#D23F31'
    ctx.beginPath()
    ctx.moveTo(28, 64); ctx.lineTo(46, 40); ctx.lineTo(66, 40); ctx.lineTo(72, 64)
    ctx.moveTo(28, 64); ctx.lineTo(50, 64); ctx.lineTo(66, 40)
    ctx.moveTo(46, 40); ctx.lineTo(44, 32); ctx.moveTo(66, 40); ctx.lineTo(64, 30); ctx.lineTo(72, 30)
    ctx.stroke()
  }
  else {
    ctx.fillStyle = '#9CC0E6'
    ctx.fillRect(0, 0, 100, 100)
    ctx.fillStyle = '#FFE08A'
    ctx.beginPath()
    ctx.arc(76, 24, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#5C6F8E'
    ctx.beginPath()
    ctx.moveTo(-5, 100); ctx.lineTo(38, 34); ctx.lineTo(80, 100)
    ctx.fill()
    ctx.fillStyle = '#44557A'
    ctx.beginPath()
    ctx.moveTo(30, 100); ctx.lineTo(70, 50); ctx.lineTo(110, 100)
    ctx.fill()
    ctx.fillStyle = '#F5F8FF'
    ctx.beginPath()
    ctx.moveTo(38, 34); ctx.lineTo(30, 46); ctx.lineTo(46, 46)
    ctx.fill()
  }
  ctx.restore()
}
