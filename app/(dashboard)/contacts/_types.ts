/**
 * Contacts list — shape types.
 *
 * `ContactRow` augments the wire `Client` with display-only fields
 * (contact_category, role_label) computed from existing columns so the
 * table can render without schema changes. When the backend ships a
 * `contact_type` column, the derivation becomes a passthrough.
 *
 * NOTE: the legacy in-file name `IdentificationCard` came from a
 * codemod side-effect (lucide `Contact` icon → phosphor
 * `IdentificationCard`) and is dropped in favour of `ContactRow`,
 * which states what it is.
 */

import type { ReactNode } from 'react'
import type { Client } from '@/types'

export type ColumnId =
  | 'name'
  | 'tags'
  | 'email'
  | 'phone'
  | 'address'
  | 'date_of_birth'
  | 'client_code'
  | 'ghana_card'
  | 'status'

export type SortDir = 'asc' | 'desc'

export interface ContactRow extends Client {
  /** Always 'person' today; gets real values once the backend column ships. */
  contact_category: 'person' | 'company'
  /** Chip shown next to the name. 'Client' for everyone in the roster today. */
  role_label: string
}

export interface ColumnDef {
  id: ColumnId
  label: string
  defaultVisible: boolean
  minWidth: number
  align?: 'left' | 'right'
  sortable?: boolean
  sortValue?: (row: ContactRow) => string | number | null
  render: (row: ContactRow, expanded: boolean) => ReactNode
  csv?: (row: ContactRow) => string
}

export type TypeFilter = 'all' | 'people' | 'companies'

export type ContactRoleFilter = 'none' | 'client' | null
