'use client'

/**
 * Custom fields — composition root.
 *
 * Owns: the create/edit dialog open state and which field is being
 * edited. The list state (entity tab + search) lives in the page-state
 * hook; the field data lives in the local persisted store.
 */

import { useState } from 'react'
import { Spinner } from '@/components/shared/Spinner'
import type { CustomField } from '@/stores/custom-fields-local.store'
import { CustomFieldsHeader } from './_components/CustomFieldsHeader'
import { CustomFieldsToolbar } from './_components/CustomFieldsToolbar'
import { CustomFieldsTable } from './_components/CustomFieldsTable'
import { EmptyState } from './_components/EmptyState'
import { FieldDialog } from './_components/FieldDialog'
import { useCustomFieldsPageState } from './_hooks/use-custom-fields-page-state'

export default function CustomFieldsPage() {
  const state = useCustomFieldsPageState()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CustomField | null>(null)

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (field: CustomField) => {
    setEditing(field)
    setDialogOpen(true)
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-6"
      style={{ background: 'var(--surface-page)' }}
    >
      <CustomFieldsHeader onNew={openCreate} />

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
        }}
      >
        <CustomFieldsToolbar
          activeTab={state.activeTab}
          onTabChange={state.changeTab}
          query={state.query}
          onQueryChange={state.changeQuery}
        />

        {state.isLoading ? (
          <div
            className="flex items-center justify-center gap-2 py-16"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Spinner size={16} /> <span className="text-sm">Loading fields…</span>
          </div>
        ) : state.total === 0 ? (
          <EmptyState onNew={openCreate} />
        ) : (
          <CustomFieldsTable rows={state.fields} onEdit={openEdit} />
        )}
      </div>

      <FieldDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        field={editing}
      />
    </div>
  )
}
