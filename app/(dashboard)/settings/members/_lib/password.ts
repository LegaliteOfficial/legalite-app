import { PASSWORD_WORDS } from '../_constants'

/**
 * Pick three random words from the curated list + a 3-digit suffix.
 * Uses `crypto.getRandomValues` when available so the value isn't
 * predictable from a non-secure PRNG; falls back to `Math.random` in
 * ancient browsers (still fine for a first-login credential).
 */
export function generatePassword(): string {
  const pick = (n: number): number => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint32Array(1)
      crypto.getRandomValues(arr)
      return arr[0] % n
    }
    return Math.floor(Math.random() * n)
  }
  const w1 = PASSWORD_WORDS[pick(PASSWORD_WORDS.length)]
  const w2 = PASSWORD_WORDS[pick(PASSWORD_WORDS.length)]
  const w3 = PASSWORD_WORDS[pick(PASSWORD_WORDS.length)]
  const suffix = String(100 + pick(900))
  return `${w1}-${w2}-${w3}-${suffix}`
}
