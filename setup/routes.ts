import { defineRoutesSetup } from '@slidev/types'

/**
 * The scene workbench: scrub any canvas scene, jump between its cues, or
 * render a contact sheet (scripts/sheet.mjs drives it). `defineRoutesSetup` is
 * a supported Slidev API, and a static segment outranks the built-in `/:no`
 * route, so `/lab` wins without needing to be prepended.
 */
export default defineRoutesSetup((routes) => [
  ...routes,
  {
    path: '/lab',
    name: 'lab',
    component: () => import('../pages/lab.vue'),
  },
])
