/**
 * Map a backend `FirmRole` into the row shape this page renders. System
 * roles (Owner / Administrator / Member) are the "standard" kind and
 * can't be edited.
 */

import type { FirmRole } from '@/hooks/use-firm-roles'
import type { Role } from '../_types'

export function toRole(r: FirmRole): Role {
  return {
    id: r.id,
    name: r.name,
    description: r.description || '—',
    kind: r.is_system ? 'standard' : 'custom',
    status: r.status === 'archived' ? 'archived' : 'active',
    isSystem: r.is_system,
    memberCount: r.member_count,
  }
}
