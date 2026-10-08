'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DotsThreeOutline } from '@phosphor-icons/react'
import { useUIStore } from '@/stores/ui.store'
import { NAV_ITEMS, TAB_BAR_IDS, isNavActive } from './nav'

/**
 * Bottom tab bar for phones and tablets (below lg): the four most-used
 * destinations plus "More", which opens the full navigation drawer.
 * Sits at the bottom of the app column (not fixed), so page scroll areas
 * end above it, and pads for the home indicator.
 */
export function MobileTabBar() {
  const pathname = usePathname()
  const setMobileNav = useUIStore((s) => s.setMobileNav)
  const tabs = TAB_BAR_IDS.map((id) => NAV_ITEMS.find((i) => i.id === id)).filter(
    (t): t is NonNullable<typeof t> => Boolean(t),
  )
  const onTab = tabs.some((t) => isNavActive(pathname, t.href))

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden shrink-0 border-t"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'saturate(1.4) blur(12px)',
        WebkitBackdropFilter: 'saturate(1.4) blur(12px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="grid h-[58px] grid-cols-5">
        {tabs.map(({ id, href, label, Icon }) => {
          const active = isNavActive(pathname, href)
          return (
            <li key={id}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex h-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors active:opacity-70"
                style={{ color: active ? 'var(--gold-dark)' : 'var(--text-muted)' }}
              >
                <Icon size={23} weight={active ? 'fill' : 'regular'} />
                {id === 'dashboard' ? 'Home' : label}
              </Link>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium active:opacity-70"
            style={{ color: !onTab ? 'var(--gold-dark)' : 'var(--text-muted)' }}
          >
            <DotsThreeOutline size={23} weight={!onTab ? 'fill' : 'regular'} />
            More
          </button>
        </li>
      </ul>
    </nav>
  )
}
