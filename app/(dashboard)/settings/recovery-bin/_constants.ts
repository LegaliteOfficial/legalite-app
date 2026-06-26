import { Scales, Users, CheckSquare, FileText } from '@phosphor-icons/react'
import type { DeletedKind } from '@/stores/recovery-bin-local.store'
import type { KindTabId } from './_types'

export const TABS: { id: KindTabId; label: string }[] = [
  { id: 'all', label: 'All items' },
  { id: 'case', label: 'Cases' },
  { id: 'client', label: 'Clients' },
  { id: 'task', label: 'Tasks' },
  { id: 'document', label: 'Documents' },
]

/** Singular label per kind — used in the table type column. */
export const KIND_LABEL: Record<DeletedKind, string> = {
  case: 'Case',
  client: 'Client',
  task: 'Task',
  document: 'Document',
}

/** Icon per kind — mirrors the sidebar so items read at a glance. */
export const KIND_ICON: Record<DeletedKind, typeof Scales> = {
  case: Scales,
  client: Users,
  task: CheckSquare,
  document: FileText,
}
