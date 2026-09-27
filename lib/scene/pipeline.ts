/**
 * The VLM pipeline, drawn the same way everywhere it appears:
 * photo → vision encoder → projector (MLP) → language model.
 *
 * The projector slide builds it; the VLM → VLA slide replays it in the very
 * same place, so the room recognises the machine before it changes its output.
 * Geometry and drawing live here so the two can never drift apart.
 */
import { C, type Kit } from './kit'
import { alpha, clamp, hash, lerp, outCubic, outExpo, seg } from './math'
import { photoAt } from './photo'

export type Rect = { x: number; y: number; w: number; h: number }

export const IMG = { x: 110, y: 270, s: 240 }
export const ENC: Rect = { x: 440, y: 250, w: 330, h: 280 }
export const PRJ: Rect = { x: 870, y: 300, w: 200, h: 180 }
export const LLM: Rect = { x: 1170, y: 250, w: 670, h: 280 }
export const MID = ENC.y + ENC.h / 2

/** The input row: image tokens (blue tiles), then the text. */
export const ROW = { y: 790, x: 110, n: 20, pitch: 38, tile: 32 }
export const rowTextX = ROW.x + ROW.n * ROW.pitch + 18

export interface PipeLabels {
  enc: string
  encSub: string
  prj: string
  llm: string
  llmSub: string
}

/** A block that settles in over progress k (0..1). */
export function block(K: Kit, b: Rect, k: number, fill: string, stroke?: string) {
  if (k <= 0) return
  const { ctx } = K
  ctx.save()
  ctx.globalAlpha *= clamp(k * 2)
  const s = lerp(0.94, 1, outExpo(k))
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2)
  ctx.scale(s, s)
  K.fillRR(-b.w / 2, -b.h / 2, b.w, b.h, 14, fill)
  if (stroke) K.strokeRR(-b.w / 2, -b.h / 2, b.w, b.h, 14, stroke, 3)
  ctx.restore()
}

/**
 * Draw the pipeline. `t0` shifts the arrival (everything is in place ~1.9 s
 * after it); `lit` outlines the LLM in blue (0..1), for "it is thinking".
 */
export function pipeline(K: Kit, t: number, lab: PipeLabels, o: { t0?: number; lit?: number } = {}) {
  const u = t - (o.t0 ?? 0)
  const pk = outExpo(seg(u, 0.3, 1.1))
  K.fade(pk, () => {
    photoAt(K, IMG.x, IMG.y + 20, IMG.s)
    K.strokeRR(IMG.x, IMG.y + 20, IMG.s, IMG.s, 12, C.paper, 3)
  })
  const ek = seg(u, 0.55, 1.2)
  block(K, ENC, ek, C.table)
  K.text(lab.enc, ENC.x + ENC.w / 2, ENC.y + ENC.h / 2 - 6, { size: 34, weight: 600, fam: 'sans', align: 'center', alpha: ek })
  K.text(lab.encSub, ENC.x + ENC.w / 2, ENC.y + ENC.h / 2 + 40, { size: 24, weight: 500, fam: 'mono', color: C.mute, align: 'center', alpha: ek })
  const jk = seg(u, 0.8, 1.4)
  block(K, PRJ, jk, C.vis)
  K.text('MLP', PRJ.x + PRJ.w / 2, PRJ.y + PRJ.h / 2 + 2, { size: 44, weight: 700, fam: 'display', color: C.bg, align: 'center', base: 'middle', alpha: jk })
  K.text(lab.prj, PRJ.x + PRJ.w / 2, PRJ.y - 22, { size: 26, weight: 600, fam: 'mono', color: C.vis, align: 'center', alpha: jk })
  const lk = seg(u, 1.05, 1.7)
  const lit = o.lit ?? 0
  block(K, LLM, lk, C.table, lit > 0 ? alpha(C.vis, lit) : undefined)
  K.text(lab.llm, LLM.x + LLM.w / 2, LLM.y + LLM.h / 2 - 6, { size: 34, weight: 600, fam: 'sans', align: 'center', alpha: lk })
  K.text(lab.llmSub, LLM.x + LLM.w / 2, LLM.y + LLM.h / 2 + 40, { size: 24, weight: 500, fam: 'mono', color: C.mute, align: 'center', alpha: lk })
  K.arrow(IMG.x + IMG.s + 14, MID, ENC.x - 14, MID, { color: C.mute, k: outCubic(seg(u, 1.2, 1.6)) })
  K.arrow(ENC.x + ENC.w + 14, MID, PRJ.x - 14, MID, { color: C.mute, k: outCubic(seg(u, 1.35, 1.75)) })
  K.arrow(PRJ.x + PRJ.w + 14, MID, LLM.x - 14, MID, { color: C.mute, k: outCubic(seg(u, 1.5, 1.9)) })
}

/** One image token of the input row, in its resting place. */
export function imageToken(K: Kit, n: number, x = ROW.x + n * ROW.pitch, y = ROW.y - ROW.tile / 2) {
  K.fillRR(x, y, ROW.tile, ROW.tile, 6, alpha(C.vis, 0.55 + 0.45 * hash(n, 5)))
}
