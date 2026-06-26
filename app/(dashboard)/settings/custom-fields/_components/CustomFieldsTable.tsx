'use client'

import type { CustomField } from '@/stores/custom-fields-local.store'
import { ENTITY_LABEL, FIELD_TYPE_LABEL } from '../_constants'
import { RowMenu } from './RowMenu'

/**
 * Header row + per-field rows. Shows where each field lives, its input
 * type, whether it's required, and a disabled badge for soft-toggled
 * fields so the firm knows they're defined but off new forms.
 */
export function CustomFieldsTable({
  rows,
  onEdit,
}: {
  rows: CustomField[]
  onEdit: (field: CustomField) => void
}) {
  return (
    <>
      <div
        className="grid grid-cols-[1fr_110px_120px_90px_64px] gap-4 px-5 py-3 border-b text-[11px] font-bold uppercase tracking-wider"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <span>Field</span>
        <span>Applies to</span>
        <span>Type</span>
        <span>Required</span>
        <span className="text-right">Action</span>
      </div>
      <ul>
        {rows.map((field, i) => (
          <li
            key={field.id}
            className="grid grid-cols-[1fr_110px_120px_90px_64px] gap-4 px-5 py-4 items-center"
            style={{
              borderBottom:
                i === rows.length - 1 ? 'none' : '1px solid var(--border)',
              opacity: field.active ? 1 : 0.6,
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {field.label}
                </span>
                {!field.active && (
                  <span
                    className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider shrink-0"
                    style={{ background: 'rgba(13,27,42,0.06)', color: 'var(--text-secondary)' }}
                  >
                    Disabled
                  </span>
                )}
              </div>
              <p
                className="text-[13px] mt-1 leading-snug truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {field.helpText ??
                  (field.type === 'select'
                    ? field.options.join(', ')
                    : 'No description')}
              </p>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {ENTITY_LABEL[field.entity]}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {FIELD_TYPE_LABEL[field.type]}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {field.required ? 'Required' : 'Optional'}
            </span>
            <div className="flex justify-end">
              <RowMenu field={field} onEdit={onEdit} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
