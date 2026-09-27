import type { NavOperations, ShortcutOptions } from '@slidev/types'
import { defineShortcutsSetup } from '@slidev/types'
import { toggleSlideLocale } from '../lib/locale'

/**
 * `L` switches the deck's language live (ES ⇄ EN), canvas scenes included:
 * every scene reads its words through L('key') and redraws on the change.
 */
export default defineShortcutsSetup((_nav: NavOperations, base: ShortcutOptions[]) => [
  ...base,
  {
    key: 'l',
    name: 'locale.toggle',
    fn: () => toggleSlideLocale(),
  },
])
