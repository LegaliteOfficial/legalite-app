'use client'

import { Check, LayoutGrid, List, ListFilter, Search, Users2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  PRIORITIES,
  PRIORITY_META,
  PriorityIcon,
  type TaskPriority,
} from './task-meta'

export type TaskView = 'list' | 'board'
export type GroupBy = 'status' | 'priority' | 'assignee'

const GROUP_LABELS: Record<GroupBy, string> = {
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assignee',
}

export interface AssigneeOption {
  id: string
  name: string
}

export function TaskToolbar({
  view,
  onViewChange,
  groupBy,
  onGroupByChange,
  search,
  onSearchChange,
  priorityFilter,
  onTogglePriority,
  assigneeOptions,
  assigneeFilter,
  onToggleAssignee,
  activeFilterCount,
  onClearFilters,
}: {
  view: TaskView
  onViewChange: (v: TaskView) => void
  groupBy: GroupBy
  onGroupByChange: (g: GroupBy) => void
  search: string
  onSearchChange: (s: string) => void
  priorityFilter: Set<TaskPriority>
  onTogglePriority: (p: TaskPriority) => void
  assigneeOptions: AssigneeOption[]
  assigneeFilter: Set<string>
  onToggleAssignee: (id: string) => void
  activeFilterCount: number
  onClearFilters: () => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div
        className="flex items-center gap-2 h-9 px-3 rounded-lg border flex-1 min-w-[200px] max-w-[340px]"
        style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
      >
        <Search size={14} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks…"
          className="flex-1 bg-transparent outline-none text-[13px]"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {/* Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer transition-colors"
              style={{
                borderColor: activeFilterCount ? 'var(--gold)' : 'var(--border-default)',
                background: activeFilterCount ? 'var(--accent-today-tint)' : 'var(--surface-card)',
                color: 'var(--text-secondary)',
              }}
            >
              <ListFilter size={14} strokeWidth={1.75} />
              Filter
              {activeFilterCount > 0 && (
                <span
                  className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-semibold tabular-nums"
                  style={{ background: 'var(--gold)', color: 'var(--navy)' }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-60 p-1.5">
          <div className="flex items-center justify-between px-1.5 pb-1">
            <SectionLabel>Priority</SectionLabel>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-[11.5px] cursor-pointer"
                style={{ color: 'var(--gold-dark)' }}
              >
                Clear
              </button>
            )}
          </div>
          {PRIORITIES.map((p) => (
            <CheckRow
              key={p}
              checked={priorityFilter.has(p)}
              onClick={() => onTogglePriority(p)}
              leading={<PriorityIcon priority={p} size={14} />}
              label={PRIORITY_META[p].label}
            />
          ))}
          {assigneeOptions.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <SectionLabel>Assignee</SectionLabel>
              <div className="max-h-[200px] overflow-y-auto">
                {assigneeOptions.map((a) => (
                  <CheckRow
                    key={a.id}
                    checked={assigneeFilter.has(a.id)}
                    onClick={() => onToggleAssignee(a.id)}
                    leading={<Users2 size={13} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />}
                    label={a.name}
                  />
                ))}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group by — list view only */}
      {view === 'list' && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
                style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-secondary)' }}
              >
                <LayoutGrid size={14} strokeWidth={1.75} />
                {GROUP_LABELS[groupBy]}
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-44 p-1.5">
            <SectionLabel>Group by</SectionLabel>
            {(Object.keys(GROUP_LABELS) as GroupBy[]).map((g) => (
              <CheckRow
                key={g}
                checked={groupBy === g}
                onClick={() => onGroupByChange(g)}
                label={GROUP_LABELS[g]}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* View switch */}
      <div
        className="inline-flex rounded-lg border p-0.5 h-9"
        style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
        role="radiogroup"
        aria-label="View"
      >
        <ViewButton active={view === 'list'} onClick={() => onViewChange('list')} icon={<List size={14} strokeWidth={2} />} label="List" />
        <ViewButton active={view === 'board'} onClick={() => onViewChange('board')} icon={<LayoutGrid size={14} strokeWidth={2} />} label="Board" />
      </div>
    </div>
  )
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={active}
      title={`${label} view`}
      className="inline-flex items-center gap-1.5 h-full px-2.5 rounded-md text-[12.5px] font-medium cursor-pointer transition-colors"
      style={{
        background: active ? 'var(--accent-today-tint-strong)' : 'transparent',
        color: active ? 'var(--gold-dark)' : 'var(--text-muted)',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-1.5 py-1 text-[11px] uppercase tracking-wider font-medium"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </div>
  )
}

function CheckRow({
  checked,
  onClick,
  leading,
  label,
}: {
  checked: boolean
  onClick: () => void
  leading?: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
      className="w-full flex items-center gap-2 px-1.5 py-1.5 rounded-md text-[13px] cursor-pointer transition-colors hover:bg-[var(--surface-sunken)]"
      style={{ color: 'var(--text-primary)' }}
    >
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] border shrink-0"
        style={{
          borderColor: checked ? 'var(--gold)' : 'var(--border-default)',
          background: checked ? 'var(--gold)' : 'transparent',
        }}
      >
        {checked && <Check size={11} strokeWidth={3} color="white" />}
      </span>
      {leading}
      <span className="flex-1 text-left truncate">{label}</span>
    </button>
  )
}
