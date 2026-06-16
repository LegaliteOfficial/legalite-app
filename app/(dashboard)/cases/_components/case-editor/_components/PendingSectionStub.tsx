'use client'

/**
 * Placeholder for sections whose admin/template UI hasn't shipped yet.
 * Renders a dashed box with the message so the user understands the
 * section is reserved, not broken.
 */
export function PendingSectionStub({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border-2 border-dashed px-5 py-6 text-center"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  )
}
