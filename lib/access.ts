import { useAuthStore } from '@/stores/auth.store'

/**
 * Permission checks for the UI. The backend enforces every permission; these
 * only decide what to show, so a member is not offered actions they cannot
 * take. Slugs come from the backend catalog
 * (legalite-backend/src/firm-roles/permissions.catalog.ts).
 */

export const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function hasPermission(permissions: readonly string[], slug: string): boolean {
  return permissions.includes('*') || permissions.includes(slug)
}

/** True when the signed-in member holds `slug` in their active firm. */
export function useCan(slug: string): boolean {
  const permissions = useAuthStore((s) => s.permissions)
  if (DEV_BYPASS) return true
  return hasPermission(permissions ?? [], slug)
}

/** True when the member holds every slug given. */
export function useCanAll(...slugs: string[]): boolean {
  const permissions = useAuthStore((s) => s.permissions)
  if (DEV_BYPASS) return true
  return slugs.every((slug) => hasPermission(permissions ?? [], slug))
}

/** A checker bound to the member's permissions, for filtering lists. */
export function usePermissionChecker(): (slug: string) => boolean {
  const permissions = useAuthStore((s) => s.permissions)
  return (slug: string) => DEV_BYPASS || hasPermission(permissions ?? [], slug)
}
