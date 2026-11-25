'use client'

/**
 * Create-custom-role page. The editor itself lives in RoleEditor so the
 * edit page (/settings/roles/[id]) shares it.
 */

import { RequirePermission } from '@/components/shared/RequirePermission'
import { RoleEditor } from './_components/RoleEditor'

export default function CreateRolePage() {
  return (
    <RequirePermission permission="manage-roles" what="roles and permissions">
      <RoleEditor />
    </RequirePermission>
  )
}
