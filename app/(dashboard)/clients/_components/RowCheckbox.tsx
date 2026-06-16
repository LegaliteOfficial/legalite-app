'use client'

export function RowCheckbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label="Select row"
      className="h-4 w-4 rounded cursor-pointer"
      style={{ accentColor: 'var(--gold)' }}
    />
  )
}
