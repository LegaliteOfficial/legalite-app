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
 * Single-select filter chip — picks one of a fixed set of preset
 * options (e.g. Created-on lookback ranges). Closes the menu on select
 * so the user gets immediate feedback.
 */
export function SingleSelectChip({
  icon,
  label,
  valueLabel,
  isCustomised,
  options,
  onSelect,
}: {
  icon: React.ReactNode
  label: string
  valueLabel: string
  isCustomised: boolean
  options: { key: string; label: string; selected: boolean }[]
  onSelect: (key: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button">
            <ChipTrigger
              icon={icon}
              label={label}
              activeText={isCustomised ? valueLabel : undefined}
            />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-44">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className="text-[13px] cursor-pointer"
          >
            {opt.label}
            {opt.selected && (
              <Check
                size={12}
                strokeWidth={2}
                className="ml-auto"
                style={{ color: 'var(--text-muted)' }}
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
