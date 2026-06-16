'use client'

import {
  Clock,
  DotsThree,
  Eye,
  PencilSimple,
  Trash,
  User as UserIcon,
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Three-dot trigger that opens the per-row actions popover. Stops
 * click bubbling so opening the menu doesn't ripple any future row-
 * level click handler.
 */
export function RowMenu({
  clientName,
  onView,
  onEdit,
  onAssignCase,
  onStartTimer,
  onDelete,
}: {
  clientName: string
  onView: () => void
  onEdit: () => void
  onAssignCase: () => void
  onStartTimer: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Actions for ${clientName}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <DotsThree size={15} strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={onView}
          className="text-[13px] cursor-pointer"
        >
          <Eye size={13} strokeWidth={1.75} />
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onEdit}
          className="text-[13px] cursor-pointer"
        >
          <PencilSimple size={13} strokeWidth={1.75} />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onAssignCase}
          className="text-[13px] cursor-pointer"
        >
          <UserIcon size={13} strokeWidth={1.75} />
          Assign case
        </DropdownMenuItem>
        {/* Start a billable-hour timer for this client. Opens the
            StartTimerDialog (mounted at the page level), which walks
            through the rate gate if needed before starting. */}
        <DropdownMenuItem
          onClick={onStartTimer}
          className="text-[13px] cursor-pointer"
        >
          <Clock size={13} strokeWidth={1.75} />
          Time working hours
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="text-[13px] cursor-pointer"
          style={{ color: 'var(--accent-danger)' }}
        >
          <Trash size={13} strokeWidth={1.75} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
