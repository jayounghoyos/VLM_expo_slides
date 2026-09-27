/**
 * Overflow check.
 *
 * The canvas is a fixed 980x551. Content that exceeds it is CLIPPED (the layout
 * sets overflow:hidden deliberately), which is easy to miss while authoring and
 * impossible to miss on stage. It differs by language, because Spanish prose
 * runs roughly 20% longer than English, so both are checked.
 *
 * Requires the dev server:
 *   node scripts/check-fit.mjs [--port 3030]
 */
import { chromium } from 'playwright-chromium'
import { readFileSync } from 'node:fs'

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`)
  return i > -1 ? process.argv[i + 1] : d
}
const port = arg('port', '3030')
// one routeAlias per slide, the headmatter included
const total = [...readFileSync('slides.md', 'utf8').matchAll(/^routeAlias:/gm)].length

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
let failed = false
for (const lang of ['es', 'en']) {
  const bad = []
  for (let n = 1; n <= total; n++) {
    await p.goto(`http://localhost:${port}/#/${n}?clicks=9&lang=${lang}&scene_snap`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(500)
    const r = await p.evaluate(() => {
      const pages = [...document.querySelectorAll('.slidev-page')]
      const el = pages.find(x => x.getBoundingClientRect().height > 0)
      const lay = el?.querySelector('.slidev-layout')
      if (!lay) return null
      return { over: lay.scrollHeight - lay.clientHeight }
    })
    if (r && r.over > 4) bad.push(`${n} (+${r.over}px)`)
  }
  if (bad.length) failed = true
  console.log(' ', lang, bad.length ? `overflows: ${bad.join(', ')}` : `all ${total} slides fit`)
}
await b.close()
if (failed) {
  console.error('\n✗ slides overflow the canvas: trim the prose or tighten the component\n')
  process.exit(1)
}
console.log('\n✓ every slide fits the canvas in both languages\n')
