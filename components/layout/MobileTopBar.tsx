'use client'

import { usePathname, useRouter } from 'next/navigation'
import { CaretLeft } from '@phosphor-icons/react'
import { useAuthStore } from '@/stores/auth.store'
import { useFirmStore } from '@/stores/firm.store'
import { useUIStore } from '@/stores/ui.store'
import { navItemFor } from './nav'

/**
 * App-style header for phones and tablets (below lg).
 *
 * On a section's root page it shows the firm mark and name (the page has
 * its own large title); one level deeper (a client, a case, a settings
 * screen) it shows a back button instead, like a native app. The avatar
 * opens the navigation drawer. Pads for the notch via the safe-area inset.
 */
export function MobileTopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const firmName = useFirmStore((s) => s.firmName)
  const user = useAuthStore((s) => s.user)
  const setMobileNav = useUIStore((s) => s.setMobileNav)

  const section = navItemFor(pathname)
  const isNested = !!section && pathname !== section.href
  const title = firmName ?? 'LegaLite'
  const brand = (firmName ?? 'LegaLite')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const initials = (user?.name ?? user?.email ?? 'U')
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const goBack = () => {
    if (window.history.length > 1) router.back()
    else if (section) router.push(section.href)
  }

  return (
    <header
      className="lg:hidden sticky top-0 z-30 shrink-0 border-b"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'rgba(244, 244, 245, 0.92)',
        backdropFilter: 'saturate(1.4) blur(12px)',
        WebkitBackdropFilter: 'saturate(1.4) blur(12px)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="flex h-14 items-center gap-2 px-3">
        {isNested ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="-ml-1 inline-flex h-10 items-center gap-0.5 rounded-lg pl-1 pr-2 text-[15px] font-medium active:bg-[var(--surface-overlay)]"
            style={{ color: 'var(--gold-dark)' }}
          >
            <CaretLeft size={20} weight="bold" />
            {section?.label}
          </button>
        ) : (
          <>
            <span
              aria-hidden
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold"
              style={{ background: 'var(--navy)', color: 'var(--gold-light)' }}
            >
              {brand}
            </span>
            <span
              className="min-w-0 flex-1 truncate font-heading text-[17px] font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </span>
          </>
        )}
        {isNested && <span className="flex-1" />}

        <button
          type="button"
          onClick={() => setMobileNav(true)}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-transform active:scale-95"
          style={{ background: 'var(--gold-muted)', color: 'var(--gold-dark)' }}
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
