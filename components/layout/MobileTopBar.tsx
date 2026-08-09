'use client'

import { List } from '@phosphor-icons/react'
import { useFirmStore } from '@/stores/firm.store'
import { useUIStore } from '@/stores/ui.store'

/**
 * Slim top bar shown only below the lg breakpoint, where the sidebar is
 * hidden. The hamburger opens the mobile nav drawer; the wordmark
 * mirrors the sidebar brand.
 */
export function MobileTopBar() {
  const firmName = useFirmStore((s) => s.firmName)
  const setMobileNav = useUIStore((s) => s.setMobileNav)

  return (
    <div
      className="lg:hidden shrink-0 flex items-center gap-3 px-4 h-14 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <button
        type="button"
        onClick={() => setMobileNav(true)}
        aria-label="Open navigation menu"
        className="inline-flex items-center justify-center h-9 w-9 -ml-1 rounded-lg transition-colors hover:bg-[var(--surface-overlay)]"
        style={{ color: 'var(--text-primary)' }}
      >
        <List size={20} weight="bold" />
      </button>
      <span
        className="font-heading text-lg font-semibold tracking-tight truncate"
        style={{ color: 'var(--gold-dark)' }}
      >
        {firmName ?? 'LegaLite'}
      </span>
    </div>
  )
}
