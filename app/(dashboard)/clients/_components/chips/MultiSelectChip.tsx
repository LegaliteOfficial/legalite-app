'use client'

import { Check } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChipTrigger } from './ChipTrigger'

/**
 * Multi-select filter chip. Each option toggles in place (the menu
 * stays open so the user can pick several without re-opening). A
 * "Clear selection" footer resets the filter in one click.
 *
 * Used for Assigned to and Status.
 */
export function MultiSelectChip({
  icon,
  label,
  activeCount,
  options,
  onToggle,
  onClear,
  emptyLabel,
}: {
  icon: React.ReactNode
  label: string
  activeCount: number
  options: { key: string; label: string; meta?: string; selected: boolean }[]
  onToggle: (key: string) => void
  onClear: () => void
  emptyLabel?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button">
            <ChipTrigger icon={icon} label={label} activeCount={activeCount} />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-64 p-1">
        {options.length === 0 ? (
          <div
            className="px-3 py-4 text-[12.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {emptyLabel ?? 'No options available.'}
          </div>
        ) : (
          <>
            {options.map((opt) => (
              <DropdownMenuItem
                key={opt.key}
                onClick={(e) => {
                  e.preventDefault?.()
                  onToggle(opt.key)
                }}
                className="text-[13px] cursor-pointer"
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{opt.label}</span>
                  {opt.meta && (
                    <span
                      className="block text-[11.5px] truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {opt.meta}
                    </span>
                  )}
                </span>
                {opt.selected && (
                  <Check
                    size={12}
                    strokeWidth={2}
                    style={{ color: 'var(--text-muted)' }}
                  />
                )}
              </DropdownMenuItem>
            ))}
            {activeCount > 0 && (
              <div
                className="border-t mt-1 pt-1"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <DropdownMenuItem
                  onClick={() => onClear()}
                  className="text-[12.5px] cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Clear selection
                </DropdownMenuItem>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
