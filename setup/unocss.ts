import { defineUnoSetup } from '@slidev/types'

/**
 * Slidev's client defines the shortcut `bg-main: 'bg-white dark:bg-[#121212]'`
 * and puts that class on <body> and on its own UI chrome. #121212 is not our
 * ground, so during a slide seam — when the two slides' summed opacity dips
 * below 1 — that lighter grey shows through as a flash at every boundary.
 *
 * Redefining the shortcut fixes the deck AND Slidev's chrome in one place,
 * which is why this beats fighting it with a more specific CSS selector.
 */
export default defineUnoSetup(() => ({
  shortcuts: {
    'bg-main': 'bg-[#0B1426]',
    'text-main': 'text-[#F5F8FF]',
  },
  theme: {
    colors: {
      gen: '#FFC857',
      vis: '#4DA3FF',
      ground: '#0B1426',
      ink: '#F5F8FF',
      inkdim: '#C3D0E6',
      inkmute: '#8FA3C2',
      hairline: '#2E4068',
    },
  },
}))
