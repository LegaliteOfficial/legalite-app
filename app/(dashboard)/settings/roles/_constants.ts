import type { TabId } from './_types'

export const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All roles' },
  { id: 'custom', label: 'Custom roles' },
  { id: 'standard', label: 'System roles' },
]

export const PAGE_SIZE = 10
