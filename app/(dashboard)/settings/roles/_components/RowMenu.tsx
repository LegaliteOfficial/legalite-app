'use client'

import { useState } from 'react'
import { DotsThreeVertical } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useArchiveFirmRole } from '@/hooks/use-firm-roles'
import type { Role } from '../_types'

/**
 * Per-row 3-dot action menu. Archive is disabled for system roles
 * (Owner / Administrator / Member); Edit toasts a "coming next" hint
 * until the role-edit screen ships.
 */
export function RowMenu({ role }: { role: Role }) {
  const [open, setOpen] = useState(false)
  const archiveRole = useArchiveFirmRole()

  const handleArchive = async () => {
    try {
      await archiveRole.mutateAsync(role.id)
      toast.success(`Role "${role.name}" archived.`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to archive role.',
      )
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label={`Actions for ${role.name}`}
        className="h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-black/[0.04]"
        style={{ color: 'var(--navy)' }}
      >
        <DotsThreeVertical size={16} strokeWidth={2} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-10 w-44 rounded-md border shadow-lg overflow-hidden"
          style={{ background: 'white', borderColor: 'var(--border)' }}
        >
          <MenuItem
            onClick={() =>
              toast.message(`Edit "${role.name}" — coming next.`)
            }
          >
            Edit
          </MenuItem>
          <MenuItem
            onClick={handleArchive}
            tone={role.isSystem ? 'disabled' : 'danger'}
          >
            Archive
          </MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'default' | 'danger' | 'disabled'
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        if (tone !== 'disabled') onClick()
      }}
      disabled={tone === 'disabled'}
      className="w-full text-left text-sm px-3 py-2 transition-colors hover:bg-black/[0.04] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ color: tone === 'danger' ? '#B91C1C' : 'var(--navy)' }}
    >
      {children}
    </button>
  )
}
