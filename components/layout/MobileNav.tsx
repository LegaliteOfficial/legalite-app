'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X } from '@phosphor-icons/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { APP_BACKGROUND } from '@/components/layout/app-background'
import { useUIStore } from '@/stores/ui.store'

/**
 * Off-canvas nav for small screens (below lg). Slides the existing
 * Sidebar in from the left over a backdrop; closes on backdrop tap and
 * whenever the route changes (i.e. after tapping a nav link).
 *
 * Lives at the layout root — outside the zoomed <main> — so its fixed
 * positioning is measured against the viewport, not a scaled ancestor.
 */
export function MobileNav() {
  const open = useUIStore((s) => s.mobileNavOpen)
  const setMobileNav = useUIStore((s) => s.setMobileNav)
  const pathname = usePathname()

  // Close on navigation (covers link taps and programmatic pushes).
  useEffect(() => {
    setMobileNav(false)
  }, [pathname, setMobileNav])

  return (
    <div className="lg:hidden" aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={() => setMobileNav(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer panel — same law-firm background as the desktop sidebar
          (left-anchored so the crop mirrors it), keeping the two identical. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ ...APP_BACKGROUND, backgroundPosition: 'left center' }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <Sidebar />
        <button
          type="button"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation menu"
          className="absolute top-4 right-3 inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)' }}
        >
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>
  )
}
