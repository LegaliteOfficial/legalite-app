'use client'

/**
 * /settings/roles/[id] - edit a custom role's name, description and
 * permissions. System roles (Owner, Administrator, Member) are fixed.
 */

import { use } from 'react'
import Link from 'next/link'
import { LockSimple } from '@phosphor-icons/react'
import { RequirePermission } from '@/components/shared/RequirePermission'
import { Spinner } from '@/components/shared/Spinner'
import { useFirmRole } from '@/hooks/use-firm-roles'
import { errorMessage } from '@/lib/errors'
import { RoleEditor } from '../new/_components/RoleEditor'

function EditRoleContent({ id }: { id: string }) {
  const { data: role, isLoading, error } = useFirmRole(id)

  if (isLoading && !role) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Spinner size={16} /> Loading role...
      </div>
    )
  }

  if (error || !role || role.status !== 'active' || role.is_system) {
    const title = role?.is_system
      ? `${role.name} is a system role`
      : role && role.status !== 'active'
        ? 'This role is archived'
        : 'Role not found'
    const body = role?.is_system
      ? 'System roles cannot be changed. Create a custom role to give a different set of permissions.'
      : error
        ? errorMessage(error, 'The role could not be loaded.')
        : 'It may have been archived or removed.'
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(13,27,42,0.06)' }}>
          <LockSimple size={22} style={{ color: 'var(--navy)' }} />
        </div>
        <h1 className="font-heading text-lg font-bold" style={{ color: 'var(--navy)' }}>
          {title}
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {body}
        </p>
        <Link href="/settings/roles" className="mt-5 text-sm font-semibold hover:underline" style={{ color: 'var(--gold-dark)' }}>
          Back to roles
        </Link>
      </div>
    )
  }

  // Keyed so the form resets if a different role is opened.
  return <RoleEditor key={role.id} role={role} />
}

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <RequirePermission permission="manage-roles" what="roles and permissions">
      <EditRoleContent id={id} />
    </RequirePermission>
  )
}
