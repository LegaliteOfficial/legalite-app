import type { TabId } from './_types'

export const TABS: { id: TabId; label: string }[] = [
  { id: 'members', label: 'Members' },
  { id: 'invitations', label: 'Pending invitations' },
]

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Friendly password generator wordlist.
 *
 * Three random words from this curated list, joined with dashes, plus
 * a 3-digit numeric suffix — sample: `harbor-bronze-river-742`.
 *
 * Wordlist avoids letters that are easily confused (l, i, o) and
 * trims to ~80 short, unambiguous English words. Just enough entropy
 * for a first-login credential; the invitee changes it on first
 * sign-in.
 */
export const PASSWORD_WORDS = [
  'amber', 'beacon', 'bronze', 'cedar', 'cipher', 'clover', 'coral',
  'crystal', 'dawn', 'delta', 'echo', 'ember', 'falcon', 'forest',
  'frost', 'garnet', 'harbor', 'haven', 'hazel', 'horizon', 'indigo',
  'ivory', 'jade', 'juniper', 'kestrel', 'lagoon', 'lantern', 'maple',
  'meadow', 'mesa', 'misty', 'morning', 'nebula', 'north', 'onyx',
  'opal', 'orchid', 'pebble', 'petal', 'pine', 'prairie', 'quartz',
  'raven', 'ridge', 'river', 'sable', 'sapphire', 'sienna', 'silver',
  'spark', 'spring', 'stone', 'storm', 'summit', 'sunset', 'thunder',
  'tide', 'topaz', 'tulip', 'velvet', 'vista', 'walnut', 'willow',
  'winter', 'zephyr',
]
