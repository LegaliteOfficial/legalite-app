/** GHS amount with thousands separators, no decimals. */
export function formatGhs(n: number): string {
  return 'GHS ' + n.toLocaleString('en-GH', { maximumFractionDigits: 0 })
}

/** "15 Jan 2027" style date from an ISO string. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
