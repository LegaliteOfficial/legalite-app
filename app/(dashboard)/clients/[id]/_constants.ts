/**
 * Contact detail — static configuration.
 *
 * `TABS` drives both the tab strip and the routing switch in `page.tsx`.
 * Adding a tab is one entry here + one branch in the `<TabRouter>`.
 */

export const TABS = [
  'Dashboard',
  'Documents',
  'Bills',
  'Transactions',
  'Communications',
  'Notes',
] as const

export type Tab = (typeof TABS)[number]

/**
 * Same palette as the contacts list type-filter pills — sky-blue for
 * people, violet for companies. Keep in sync with the list page so the
 * contact avatar tint is identical across screens.
 */
export const TYPE_BADGE_PEOPLE = '#0EA5E9'
export const TYPE_BADGE_COMPANIES = '#8B5CF6'
