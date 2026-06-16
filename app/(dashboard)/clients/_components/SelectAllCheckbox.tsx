'use client'

/**
 * Header checkbox with an "indeterminate" middle state for "some but
 * not all rows selected". HTML doesn't expose indeterminate via the
 * `checked` attribute — has to be set on the DOM property after mount,
 * so we use a ref callback.
 */
export function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label="Select all rows"
      ref={(el) => {
        if (el) el.indeterminate = indeterminate
      }}
      className="h-4 w-4 rounded cursor-pointer"
      style={{ accentColor: 'var(--gold)' }}
    />
  )
}
