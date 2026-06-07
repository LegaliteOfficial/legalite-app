'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { PRACTICE_AREAS } from '@/lib/case-options'
import type { Case } from '@/types'
import {
  ADMIN_VIEW_OPTIONS,
  BILLABLE_STATUS_OPTIONS,
  EMPTY_FILTERS,
} from '../_constants'
import type { CaseFilters, OptionGroup } from '../_types'
import { DateRangeField } from './DateRangeField'
import { FilterField } from './FilterField'
import { FilterSelect } from './FilterSelect'

/**
 * Side panel mirroring the reference Filters drawer. Edits happen
 * against a local `draft` copy — only "Apply filters" commits the
 * values upstream. "Clear filters" wipes both the draft AND the applied
 * state so the user sees the table refresh immediately.
 *
 * Fields whose data we don't have yet (Responsible staff, Tags, Admin
 * view, Billable status, Permissions, Blocked users, Status date)
 * render with disabled placeholders so the UI matches the reference
 * end-to-end; they start filtering once the backend ships the columns.
 */
export function FilterDrawer({
  open,
  onOpenChange,
  value,
  onApply,
  cases,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: CaseFilters
  onApply: (next: CaseFilters) => void
  cases: Case[]
}) {
  const [draft, setDraft] = useState<CaseFilters>(value)

  // Re-sync draft from applied state every open. Without this, dismissing
  // mid-edit then re-opening shows abandoned partial changes.
  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  const setField = <K extends keyof CaseFilters>(key: K, val: CaseFilters[K]) => {
    setDraft((d) => ({ ...d, [key]: val || undefined }))
  }

  const handleApply = () => {
    onApply(draft)
    onOpenChange(false)
  }

  const handleClear = () => {
    setDraft(EMPTY_FILTERS)
    onApply(EMPTY_FILTERS)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Light backdrop so the user can still see what their filters
            will narrow as they edit. */}
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-40 data-[open]:animate-in data-[open]:fade-in-0 data-[closed]:animate-out data-[closed]:fade-out-0"
          style={{ background: 'rgba(13,27,42,0.18)' }}
        />
        <DialogPrimitive.Popup
          className="fixed top-4 right-4 bottom-4 z-50 w-[480px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border outline-none data-[open]:animate-in data-[open]:slide-in-from-right-4 data-[closed]:animate-out data-[closed]:slide-out-to-right-4"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-soft)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <DrawerHeader onClose={() => onOpenChange(false)} />
          <DrawerBody draft={draft} setDraft={setDraft} setField={setField} cases={cases} />
          <DrawerFooter onClear={handleClear} onApply={handleApply} />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ── Drawer subviews ────────────────────────────────────────────────────────

function DrawerHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <DialogPrimitive.Title
        className="text-[14px] font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        Filters
      </DialogPrimitive.Title>
      <button
        onClick={onClose}
        className="p-1 rounded-md transition-colors cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-sunken)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-muted)'
        }}
        aria-label="Close filters"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  )
}

function DrawerBody({
  draft,
  setDraft,
  setField,
  cases,
}: {
  draft: CaseFilters
  setDraft: React.Dispatch<React.SetStateAction<CaseFilters>>
  setField: <K extends keyof CaseFilters>(key: K, val: CaseFilters[K]) => void
  cases: Case[]
}) {
  // Distinct option lists derived from the rows we already have. Cheap
  // at typical firm sizes; memoize per field if it ever shows up in
  // profile traces.
  const uniq = (arr: Array<string | null | undefined>) =>
    Array.from(new Set(arr.filter((v): v is string => !!v))).sort()
  const clientOptions = uniq(cases.map((c) => c.client_name))
  const responsibleOptions = uniq(cases.map((c) => c.assigned_lawyer))
  const originatingOptions = uniq(cases.map((c) => c.originating_lawyer))

  const { user } = useAuthStore()
  const meLabel = `${user?.name ?? 'Me'} (Me)`
  const permissionsGroups: OptionGroup[] = [
    { label: 'Groups', options: ['Everyone'] },
    { label: 'Users', options: [meLabel] },
  ]

  const hasStatusDate = !!(draft.status_date_from || draft.status_date_to)

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
      <FilterField label="Client">
        <FilterSelect
          value={draft.client ?? ''}
          onChange={(v) => setField('client', v)}
          placeholder="Find a contact"
          options={clientOptions}
        />
      </FilterField>

      <FilterField label="Responsible lawyer">
        <FilterSelect
          value={draft.responsible_lawyer ?? ''}
          onChange={(v) => setField('responsible_lawyer', v)}
          placeholder="Find a firm user"
          options={responsibleOptions}
        />
      </FilterField>

      <FilterField label="Originating lawyer">
        <FilterSelect
          value={draft.originating_lawyer ?? ''}
          onChange={(v) => setField('originating_lawyer', v)}
          placeholder="Find a firm user"
          options={originatingOptions}
        />
      </FilterField>

      <FilterField label="Responsible staff">
        <FilterSelect
          value={draft.responsible_staff ?? ''}
          onChange={(v) => setField('responsible_staff', v)}
          placeholder="Find a firm user"
          options={[]}
          disabled
          disabledHint="Staff roster not configured yet"
        />
      </FilterField>

      <FilterField label="Case notifications">
        <FilterSelect
          value={draft.notifications ?? ''}
          onChange={(v) => setField('notifications', v)}
          placeholder="Find a firm user"
          options={[]}
          disabled
          disabledHint="Notification subscriptions coming soon"
        />
      </FilterField>

      <FilterField label="Tags">
        <FilterSelect
          value={draft.tags ?? ''}
          onChange={(v) => setField('tags', v)}
          placeholder="Select tags"
          options={[]}
          disabled
          disabledHint="Tag manager coming soon"
        />
      </FilterField>

      <FilterField label="Admin view">
        <FilterSelect
          value={draft.admin_view ?? ''}
          onChange={(v) => setField('admin_view', v)}
          placeholder="Select view"
          options={ADMIN_VIEW_OPTIONS}
        />
      </FilterField>

      <FilterField label="Billable status">
        <FilterSelect
          value={draft.billable_status ?? ''}
          onChange={(v) => setField('billable_status', v)}
          placeholder="Select status"
          options={BILLABLE_STATUS_OPTIONS}
        />
      </FilterField>

      <FilterField label="Last activity date">
        <DateRangeField
          from={draft.last_activity_from ?? ''}
          to={draft.last_activity_to ?? ''}
          onFromChange={(v) => setField('last_activity_from', v)}
          onToChange={(v) => setField('last_activity_to', v)}
        />
      </FilterField>

      <FilterField label="Permissions">
        <FilterSelect
          value={draft.permissions ?? ''}
          onChange={(v) => setField('permissions', v)}
          placeholder="Find a group"
          groups={permissionsGroups}
          clearable
        />
      </FilterField>

      <FilterField label="Practice area">
        <FilterSelect
          value={draft.practice_area ?? ''}
          onChange={(v) => setField('practice_area', v)}
          placeholder="Find a practice area"
          options={PRACTICE_AREAS}
        />
      </FilterField>

      <FilterField label="Blocked users">
        <FilterSelect
          value={draft.blocked_users ?? ''}
          onChange={(v) => setField('blocked_users', v)}
          placeholder="Find a case by blocked user"
          options={[]}
          disabled
          disabledHint="User-level case blocking coming soon"
        />
      </FilterField>

      <FilterField label="Status date">
        {hasStatusDate ? (
          <DateRangeField
            from={draft.status_date_from ?? ''}
            to={draft.status_date_to ?? ''}
            onFromChange={(v) => setField('status_date_from', v)}
            onToChange={(v) => setField('status_date_to', v)}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft((d) => ({ ...d, status_date_from: '', status_date_to: '' }))
            }}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-sunken)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-card)'
            }}
          >
            <Plus size={13} strokeWidth={2} />
            Add status date
          </button>
        )}
      </FilterField>

      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <div
          className="text-[12.5px] font-semibold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Custom fields
        </div>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          Customise and speed up your workflow by{' '}
          <button
            type="button"
            onClick={() => toast.info('Custom fields admin is coming next.')}
            className="underline cursor-pointer"
            style={{ color: 'var(--gold-dark)' }}
          >
            creating custom fields
          </button>
          .
        </p>
      </div>
    </div>
  )
}

function DrawerFooter({
  onClear,
  onApply,
}: {
  onClear: () => void
  onApply: () => void
}) {
  return (
    <div
      className="flex items-center justify-end gap-2 px-5 py-3 border-t"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <Button variant="outline" size="sm" onClick={onClear}>
        Clear filters
      </Button>
      <Button size="sm" onClick={onApply}>
        Apply filters
      </Button>
    </div>
  )
}
