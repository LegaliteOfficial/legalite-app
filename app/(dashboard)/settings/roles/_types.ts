export type RoleKind = 'standard' | 'custom'
export type RoleStatus = 'active' | 'archived'

export interface Role {
  id: string
  name: string
  description: string
  kind: RoleKind
  status: RoleStatus
  isSystem: boolean
  memberCount: number
}

export type TabId = 'all' | 'custom' | 'standard'
