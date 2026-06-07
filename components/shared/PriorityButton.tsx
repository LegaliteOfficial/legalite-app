'use client'

/**
 * PriorityButton
 * --------------
 * Drop-in priority flag for any entity (case, client, invoice).
 * Renders a small star-shaped trigger; clicking opens a dropdown
 * with High / Medium / Low / No priority. The star colour reflects
 * the current level (red = high, gold = medium, slate = low,
 * outlined / muted = unset) so the priority reads at a glance even
 * before the menu opens.
 *
 * Usage:
 *   <PriorityButton
 *     entityType="case"
 *     entityId={caseId}
 *     label="Mensah v. GRA"
 *     metadata={{ next_court_date: "2026-06-04T09:00:00Z" }}
 *   />
 *
 * The component is reusable across:
 *   - Case row menus / detail pages
 *   - Client row menus / detail pages
 *   - Invoice / billing rows
 *   - Anywhere else worth flagging
 *
 * It writes to the global `usePriorityStore`, which the dashboard
 * panels and the reminder hook both subscribe to — so this is the
 * single source of truth for prioritisation across the app.
 */

import { Star } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth.store'
import {
  REMINDER_DAYS_BEFORE,
  usePriorityStore,
  type PriorityEntityType,
  type PriorityLevel,
} from '@/stores/priority.store'

interface PriorityButtonProps {
  /** Which kind of thing this is (drives the dashboard grouping). */
  entityType: PriorityEntityType
  /** Stable id of the entity. Must match the id used elsewhere. */
  entityId: string
  /** Human-readable label shown on the dashboard list cards. */
  label: string
  /**
   * Opaque bag of fields the reminder loop reads (e.g. for cases:
   * `{ next_court_date }`). Always include what's available — the
   * worst case is the reminder loop silently ignores it.
   */
  metadata?: Record<string, string | number | null | undefined>
  /** Use the compact, icon-only variant for tight rows. */
  variant?: 'compact' | 'inline'
  /** Optional className for layout tweaks at the call site. */
  className?: string
}

/**
 * Visual style for each level. Centralised here so every PriorityButton,
 * dashboard pill, and reminder toast pulls from the same palette.
 */
export const PRIORITY_STYLE: Record<
  PriorityLevel,
  { color: string; bg: string; label: string }
> = {
  high: {
    color: 'var(--accent-danger, #C0392B)',
    bg: 'rgba(192, 57, 43, 0.12)',
    label: 'High',
  },
  medium: {
    color: 'var(--accent-today, #C9972B)',
    bg: 'var(--accent-today-tint, rgba(201, 151, 43, 0.12))',
    label: 'Medium',
  },
  low: {
    color: 'var(--text-secondary, #6B7280)',
    bg: 'var(--surface-sunken, rgba(0,0,0,0.04))',
    label: 'Low',
  },
}

const LEVELS_IN_MENU_ORDER: PriorityLevel[] = ['high', 'medium', 'low']

export function PriorityButton({
  entityType,
  entityId,
  label,
  metadata,
  variant = 'compact',
  className,
}: PriorityButtonProps) {
  // Subscribe to just this entity's record so we don't re-render
  // every PriorityButton on every store change.
  const record = usePriorityStore((s) => s.records[`${entityType}:${entityId}`])
  const setPriority = usePriorityStore((s) => s.setPriority)
  const clearPriority = usePriorityStore((s) => s.clearPriority)
  const user = useAuthStore((s) => s.user)

  const currentLevel = record?.level
  const isSet = currentLevel != null

  /** Apply a new level and toast a friendly confirmation. */
  const apply = (level: PriorityLevel) => {
    // Under DEV_BYPASS the auth store carries no real user — the
    // AuthGuard short-circuits. Fall back to a stable dev id so
    // priorities still attribute consistently in dev. In prod the
    // AuthGuard ensures `user` is populated by the time this fires.
    const userId = user?.id ?? 'dev-user'
    setPriority({
      entityType,
      entityId,
      level,
      label,
      userId,
      metadata,
    })
    // Different language per entity type so the toast reads naturally.
    const entityNoun =
      entityType === 'case'
        ? 'Case'
        : entityType === 'client'
          ? 'Client'
          : 'Invoice'
    const reminderHint =
      entityType === 'case' && metadata?.next_court_date
        ? ` We'll remind you ${REMINDER_DAYS_BEFORE[level]
            .map((d) => `${d} day${d === 1 ? '' : 's'} before`)
            .join(' and ')} the hearing.`
        : ''
    toast.success(
      `${entityNoun} flagged ${PRIORITY_STYLE[level].label}.${reminderHint}`,
    )
  }

  const clear = () => {
    clearPriority(entityType, entityId)
    toast.message('Priority cleared.')
  }

  // Star colour + fill reflect the current level. Unset shows an
  // outlined muted star.
  const triggerColor = currentLevel
    ? PRIORITY_STYLE[currentLevel].color
    : 'var(--text-muted)'
  const triggerFill = isSet ? triggerColor : 'transparent'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={
              isSet
                ? `Priority: ${PRIORITY_STYLE[currentLevel].label}. Change priority.`
                : 'Set priority'
            }
            onClick={(e) => e.stopPropagation()}
            className={
              variant === 'inline'
                ? `inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px] font-medium cursor-pointer ${className ?? ''}`
                : `inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer ${className ?? ''}`
            }
            style={
              variant === 'inline'
                ? {
                    background: isSet
                      ? PRIORITY_STYLE[currentLevel].bg
                      : 'transparent',
                    color: triggerColor,
                  }
                : { color: triggerColor }
            }
            title={
              isSet
                ? `Priority: ${PRIORITY_STYLE[currentLevel].label}`
                : 'Set priority'
            }
          >
            <Star
              size={variant === 'inline' ? 12 : 15}
              strokeWidth={1.75}
              fill={triggerFill}
            />
            {variant === 'inline' && (
              <span>
                {isSet ? PRIORITY_STYLE[currentLevel].label : 'Priority'}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        {LEVELS_IN_MENU_ORDER.map((lvl) => (
          <DropdownMenuItem
            key={lvl}
            onClick={() => apply(lvl)}
            className="text-[13px] cursor-pointer"
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: PRIORITY_STYLE[lvl].color }}
            />
            {PRIORITY_STYLE[lvl].label}
            {currentLevel === lvl && (
              <span
                className="ml-auto text-[11px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Current
              </span>
            )}
          </DropdownMenuItem>
        ))}
        {isSet && (
          <DropdownMenuItem
            onClick={clear}
            className="text-[13px] cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            No priority
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
