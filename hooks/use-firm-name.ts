/**
 * useEffectiveFirmName
 * ====================
 * Resolve the firm name that should appear in user-facing copy
 * (email templates, statements, bills, the sidebar wordmark, etc.).
 *
 * A firm's "name" can come from three different places, each set
 * at a different point in the firm's lifecycle:
 *
 *   1. **Branding override** — `useFirmStore.firmName`
 *      Set later by the firm via Settings -> Account Info. This is
 *      the explicit "display this name everywhere" toggle, so it
 *      takes precedence whenever it's populated. Firms often pick a
 *      shorter trading name here ("Mensah Law" instead of the full
 *      legal entity "Mensah & Associates LLP").
 *
 *   2. **Active membership** — `useAuthStore.activeMembership.firm_name`
 *      Captured at sign-up time when the partner registers the firm.
 *      This is the canonical firm name on the server side and is
 *      what shows up for any firm that hasn't customised branding
 *      yet.
 *
 *   3. **Legacy `user.firm`** — `useAuthStore.user.firm`
 *      The pre-tenancy field that used to live directly on User
 *      before memberships landed. Kept here purely so old persisted
 *      auth blobs in users' localStorage don't render blank during
 *      the rollout window. New sign-ups won't populate it.
 *
 * When none of these are set (brand-new account mid-onboarding,
 * or a corrupted persist blob) the caller picks the fallback that
 * fits its surface:
 *
 *   - `'product'`  — render the LegaLite wordmark. Right for the
 *                    sidebar, login screen, and other surfaces
 *                    where we're branding *the app*, not the firm.
 *   - `'sentence'` — render "our firm". Right for client-facing
 *                    copy (email templates, statements) where the
 *                    string lives inside a sentence written FROM
 *                    the firm to the client: "Thank you for your
 *                    continued trust in our firm" reads correctly
 *                    (first-person from the writer); "your firm"
 *                    would suggest the client's firm; "LegaLite"
 *                    is actively wrong because LegaLite isn't who
 *                    the client hired.
 *   - `'none'`     — return `null` and let the caller decide.
 *
 * Default is `'sentence'` because client-facing copy is the most
 * common consumer and getting it wrong (calling our product the
 * client's law firm) is the worst failure mode.
 *
 * IMPORTANT: this hook reads three stores, so the returned string
 * updates whenever the underlying branding/membership changes. It
 * is intentionally a pure derivation — no side effects, safe to
 * call in render.
 */

import { useAuthStore } from '@/stores/auth.store'
import { useFirmStore } from '@/stores/firm.store'

export type FirmNameFallback = 'product' | 'sentence' | 'none'

export interface UseEffectiveFirmNameOptions {
  /**
   * What to return when no firm name is set anywhere.
   * Defaults to `'sentence'` -> `'your firm'`. See the file-level
   * doc-comment for the rationale.
   */
  fallback?: FirmNameFallback
}

/**
 * Pure resolver — exposed for non-hook contexts (e.g. building an
 * email body inside a `useMemo` initialiser, or unit tests). React
 * components should prefer the hook below.
 */
export function resolveFirmName(args: {
  brandingName?: string | null
  membershipName?: string | null
  legacyName?: string | null
  fallback?: FirmNameFallback
}): string | null {
  const fallback = args.fallback ?? 'sentence'
  const candidates = [args.brandingName, args.membershipName, args.legacyName]
  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (trimmed) return trimmed
  }
  if (fallback === 'product') return 'LegaLite'
  if (fallback === 'sentence') return 'our firm'
  return null
}

export function useEffectiveFirmName(
  options: UseEffectiveFirmNameOptions = {},
): string | null {
  // Subscribe to each underlying slice as a scalar so re-renders
  // only fire when the resolved value could change. Pulling the
  // whole store object would re-render on every unrelated branding
  // tweak.
  const brandingName = useFirmStore((s) => s.firmName)
  const membershipName = useAuthStore((s) => s.activeMembership?.firm_name ?? null)
  const legacyName = useAuthStore((s) => s.user?.firm ?? null)
  return resolveFirmName({
    brandingName,
    membershipName,
    legacyName,
    fallback: options.fallback,
  })
}

/**
 * Convenience for the common "is the firm name actually set or are
 * we falling back?" question — useful in places that want to nudge
 * the user toward Settings -> Account Info when nothing's set.
 */
export function useHasCustomFirmName(): boolean {
  return useEffectiveFirmName({ fallback: 'none' }) !== null
}
