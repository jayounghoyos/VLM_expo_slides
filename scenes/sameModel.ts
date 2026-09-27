/**
 * Same model, a different answer: the hinge from VLM to VLA.
 * It replays the projector slide's pipeline in the very same place, so the
 * room recognises the machine, and then changes only what goes in and out.
 *
 *   arrive  the VLM from before: image tokens + "how many mugs?" → "two mugs"
 *   1 ask    the question becomes an instruction: "pick up the orange mug"
 *   2 emit   the LLM answers with tokens again, but they are action tokens
 *   3 decode each token is a bin → a number: six deltas and the gripper
 */
import { defineScene } from '../lib/scene/types'
import { C } from '../lib/scene/kit'
import { clamp, outBack, outCubic, presence, seg } from '../lib/scene/math'
import { LLM, ROW, imageToken, pipeline, rowTextX } from '../lib/scene/pipeline'

const OUT_Y = 620 // the action row, under the LLM
const OUT_X = 1130
const AW = 96
const AG = 6
const ACT = [0.12, -0.04, 0.31, 0.0, 0.08, -0.02, 1] // illustrative
const DIMS = ['Δx', 'Δy', 'Δz', 'Δα', 'Δβ', 'Δγ']
const fmt = (v: number) => (v === 1 ? '1' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}`)
/** OpenVLA: 256 bins, written as the last 256 ids of Llama's vocabulary (31744–31999). */
const tokenId = (v: number) => 31744 + Math.round(((clamp(v, -1, 1) + 1) / 2) * 255)

export default defineScene({
  cues: [2.4, 5.4, 9.0, 12.8],
  draw({ t, L, K }) {
    K.title(L('title'), t, 0.1)
    const lab = { enc: L('enc'), encSub: L('enc_sub'), prj: L('prj'), llm: L('llm'), llmSub: L('llm_sub') }
    pipeline(K, t, lab, { lit: outCubic(seg(t, 5.6, 6.0)) })

    // ── the input row: image tokens, then the text ─────────────────────
    for (let n = 0; n < ROW.n; n++) {
      const k = outBack(seg(t, 1.2 + n * 0.02, 1.5 + n * 0.02))
      if (k <= 0) continue
      K.fade(clamp(k * 2), () => imageToken(K, n))
    }
    const chips = (words: string[], a: number, b: number) => {
      let x = rowTextX
      words.forEach((w, i) => {
        const k = presence(t, a + i * 0.08, b, 0.35, 0.25)
        x += K.chip(w, x, ROW.y - 28, { size: 32, h: 56, pad: 14, k: outBack(k), bg: '#1D2C4A', fg: C.paper }) + 10
      })
      return x - 10
    }
    const qEnd = chips(L('q').split('|'), 1.5, 2.6)
    chips(L('instr').split('|'), 2.9, 1e9)

    // arrive: the old answer, exactly where the projector slide left it
    const oldA = presence(t, 1.9, 2.6)
    if (oldA > 0) {
      const ax = qEnd + 90
      K.fade(oldA, () => K.arrow(LLM.x + LLM.w - 180, LLM.y + LLM.h + 16, ax + 60, ROW.y - 44, { color: C.gen, lw: 3 }))
      let gx = ax
      L('a').split('|').forEach((w) => {
        gx += K.chip(w, gx, ROW.y - 28, { size: 32, h: 56, pad: 14, k: oldA, bg: C.genDeep, fg: C.gen }) + 10
      })
    }
    // the input goes up into the LLM (the same arrow as before, shifted left)
    K.arrow(560, ROW.y - 44, LLM.x - 14, LLM.y + LLM.h - 40, { color: C.paper, lw: 3, k: outCubic(seg(t, 1.8, 2.3)) })
    K.label(L('in'), rowTextX, ROW.y + 88, { color: C.paper, size: 26, alpha: outCubic(seg(t, 3.4, 3.8)) })

    // ── 2. action tokens come out, one at a time ───────────────────────
    const dk = outCubic(seg(t, 5.7, 6.1))
    K.arrow(1700, LLM.y + LLM.h + 16, 1700, OUT_Y - 40, { color: C.gen, lw: 3, k: dk })
    ACT.forEach((v, i) => {
      const k = seg(t, 6.2 + i * 0.28, 6.6 + i * 0.28)
      K.chip(String(tokenId(v)), OUT_X + i * (AW + AG), OUT_Y - 26, { size: 25, h: 52, pad: 10, k: outBack(k), bg: C.genDeep, fg: C.gen })
    })
    K.label(L('toks'), OUT_X, OUT_Y - 48, { color: C.gen, size: 26, alpha: outCubic(seg(t, 6.4, 6.9)) })

    // ── 3. each token decodes to a number ──────────────────────────────
    ACT.forEach((v, i) => {
      const x = OUT_X + i * (AW + AG) + AW / 2
      const k = outCubic(seg(t, 9.2 + i * 0.12, 9.6 + i * 0.12))
      if (k <= 0) return
      K.fade(k, () => {
        K.text(fmt(v), x, OUT_Y + 76 - (1 - k) * 12, { size: 30, weight: 600, fam: 'mono', color: C.paper, align: 'center' })
        K.text(i < 6 ? DIMS[i] : L('grip'), x, OUT_Y + 112, { size: 22, weight: 500, fam: 'mono', color: C.mute, align: 'center' })
      })
    })
    K.punch(L('punch'), t, 10.6, { y: 975, size: 46 })
    K.fade(outCubic(seg(t, 6.4, 6.9)), () => K.cite(L('cite')))
  },
})
