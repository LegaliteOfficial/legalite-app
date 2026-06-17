import type { Users } from '@phosphor-icons/react'

export type PermissionDef = { id: string; label: string }

export type PermissionGroup = {
  id: string
  label: string
  Icon: typeof Users
  permissions: PermissionDef[]
}

export type SectionDef = {
  id: string
  label: string
  description: string
  groups: PermissionGroup[]
  note?: string
  newCount?: number
}

export type GrantedCount = { granted: number; total: number }
