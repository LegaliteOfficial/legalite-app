import type { DeletedKind } from '@/stores/recovery-bin-local.store'

/** Toolbar tab: every kind plus an "all" lead tab. */
export type KindTabId = 'all' | DeletedKind
