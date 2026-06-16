/**
 * First letters of up to two whitespace-delimited words, uppercased.
 * Returns "?" for empty input so the avatar never renders blank.
 */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}
