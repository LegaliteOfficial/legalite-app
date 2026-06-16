'use client'

import { Button } from '@/components/ui/button'

interface Props {
  isEdit: boolean
  submitting: boolean
  canSave: boolean
  onCancel: () => void
  onSave: (alsoRunConflictCheck: boolean) => void
}

/**
 * Sticky header above the form scroller. Title + subtitle on the left,
 * Cancel / Save & conflict check / Save buttons on the right. Pair with
 * `<EditorFooterActions>` at the very bottom of the form so the user
 * doesn't have to scroll back up to save.
 */
export function EditorTopBar({
  isEdit,
  submitting,
  canSave,
  onCancel,
  onSave,
}: Props) {
  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 border-b"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      <div>
        <h1
          className="text-[20px] font-semibold leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {isEdit ? 'Edit case' : 'New case'}
        </h1>
        <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {isEdit
            ? 'Update the sections below. Changes save when you click Save.'
            : 'Fill in the sections below to open a new case. Save anytime.'}
        </p>
      </div>
      <Actions
        isEdit={isEdit}
        submitting={submitting}
        canSave={canSave}
        onCancel={onCancel}
        onSave={onSave}
      />
    </header>
  )
}

/**
 * Same button trio rendered at the bottom of the long form. Mirrors the
 * top bar so save is always one click away regardless of scroll position.
 */
export function EditorFooterActions(props: Props) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2 pb-8">
      <Actions {...props} />
    </div>
  )
}

function Actions({
  isEdit,
  submitting,
  canSave,
  onCancel,
  onSave,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      {!isEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSave(true)}
          disabled={submitting}
        >
          Save and run conflict check
        </Button>
      )}
      <Button
        size="sm"
        onClick={() => onSave(false)}
        disabled={submitting || !canSave}
      >
        {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Save case'}
      </Button>
    </div>
  )
}
