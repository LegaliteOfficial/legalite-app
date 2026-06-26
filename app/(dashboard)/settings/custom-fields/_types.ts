import type { FieldEntity } from '@/stores/custom-fields-local.store'

/** Toolbar tab: every entity plus an "all" lead tab. */
export type EntityTabId = 'all' | FieldEntity
