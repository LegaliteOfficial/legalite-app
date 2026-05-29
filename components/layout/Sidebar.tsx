'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useFirmStore } from '@/stores/firm.store'
import {
  LayoutDashboard,
  Users,
  Scale,
  CheckSquare,
  Contact,
  FileText,
  Calendar as CalendarIcon,
  Timer,
  Sparkles,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard',       href: '/dashboard' },
      { id: 'clients',   Icon: Users,           label: 'Clients',         href: '/clients' },
      { id: 'cases',     Icon: Scale,           label: 'Cases',           href: '/cases' },
      { id: 'tasks',     Icon: CheckSquare,     label: 'Tasks',           href: '/tasks' },
      { id: 'contacts',  Icon: Contact,         label: 'Contacts',        href: '/contacts' },
      { id: 'documents', Icon: FileText,        label: 'Documents',       href: '/documents' },
      { id: 'calendar',  Icon: CalendarIcon,    label: 'Calendar',        href: '/calendar' },
      { id: 'deadline',  Icon: Timer,           label: 'Deadline engine', href: '/deadline' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'ai',      Icon: Sparkles,      label: 'AI assistant', href: '/ai' },
      { id: 'comms',   Icon: MessageSquare, label: 'Client comms', href: '/comms' },
      { id: 'billing', Icon: CreditCard,    label: 'Billing',      href: '/billing' },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'settings', Icon: Settings, label: 'Settings', href: '/settings' },
    ],
  },
]

const TEXT_DIM = 'rgba(255,255,255,0.58)'
const TEXT_MUTED = 'rgba(255,255,255,0.38)'
const TEXT_LABEL = 'rgba(255,255,255,0.32)'
const HOVER_BG = 'rgba(255,255,255,0.06)'
const ACTIVE_BG = 'rgba(201,151,43,0.14)'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  // Firm branding overrides — when set in Settings -> Account Info
  // the wordmark/logo at the top of the sidebar switches to the
  // firm's own identity. Falls back to "LegaLite" when both are null.
  const firmName = useFirmStore((s) => s.firmName)
  const firmLogoDataUrl = useFirmStore((s) => s.firmLogoDataUrl)
  const firmBrandColor = useFirmStore((s) => s.firmBrandColor)
  const brandLabel = firmName ?? 'LegaLite'
  // Initials drive the colour-chip render. Use the firm's first 1-2
  // word initials when a firm name is set; fall back to "L" for the
  // LegaLite default so the chip still reads as a brand mark.
  const brandInitials = (firmName ?? 'LegaLite')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside
      // 5% size bump applied via `zoom` so the text-[10.5px] / text-[13.5px]
      // pixel values + icon sizes + paddings all scale together. Pairs with
      // the font-medium → font-semibold bump below for a slightly bolder,
      // slightly larger sidebar without rewriting every literal.
      style={{ width: 248, background: 'transparent', zoom: 1.05 }}
      className="flex flex-col shrink-0 h-full relative overflow-hidden rounded-2xl"
    >
      {/* Brand */}
      {/* Default state shows the LegaLite wordmark. Once the firm
          fills in Settings -> Account Info, the wordmark switches
          to the firm name; an uploaded logo (if any) shows as a
          square chip to the left of the text. Truncation handles
          long firm names so the layout stays stable. */}
      <Link
        href="/settings/account-info"
        className="block px-5 pt-6 pb-5 group"
        title={firmName ? `${firmName} — edit firm details` : 'Set up your firm'}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Brand chip precedence:
                1. Logo if uploaded   -> image chip (most specific)
                2. Else brand colour  -> coloured square with initials
                3. Else               -> no chip, just the wordmark
              Logo wins because it carries more identity than a colour
              swatch; a firm with both set is treating the colour as a
              fallback the moment they ever pull the logo. */}
          {firmLogoDataUrl ? (
            // Uploaded logos can be any aspect ratio — `object-contain`
            // keeps the whole logo visible inside the chip rather than
            // cropping it. The chip itself is square so very wide
            // logos render letterboxed, very tall ones pillarboxed.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firmLogoDataUrl}
              alt={`${brandLabel} logo`}
              className="h-7 w-7 rounded-md object-contain shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
          ) : firmBrandColor ? (
            <span
              aria-hidden
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-[11.5px] font-semibold shrink-0"
              style={{
                background: firmBrandColor,
                // Derive a readable text colour from the chip fill so
                // the initials stay legible on both dark and light
                // brand colours (e.g. navy vs cream).
                color: readableTextOn(firmBrandColor),
              }}
            >
              {brandInitials}
            </span>
          ) : null}
          <h1
            className="font-heading text-[22px] font-semibold tracking-tight truncate"
            style={{ color: 'var(--gold-light)' }}
          >
            {brandLabel}
          </h1>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {NAV_GROUPS.map((group, idx) => (
          <div key={group.label} className={idx === 0 ? '' : 'mt-6'}>
            <div
              className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: TEXT_LABEL }}
            >
              {group.label}
            </div>
            <ul className="flex flex-col">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.Icon
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-semibold transition-colors"
                      style={{
                        color: isActive ? 'var(--gold-light)' : TEXT_DIM,
                        background: isActive ? ACTIVE_BG : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = HOVER_BG
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <Icon
                        size={15}
                        strokeWidth={1.75}
                        style={{
                          color: isActive ? 'var(--gold-light)' : TEXT_MUTED,
                        }}
                      />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
              color: 'var(--navy)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[13px] font-semibold truncate"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {user?.name ?? 'Signed in'}
            </div>
            {user?.role && (
              <div className="text-[11px] truncate" style={{ color: TEXT_MUTED }}>
                {user.role.replace('_', ' ')}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md transition-colors cursor-pointer shrink-0"
            title="Sign out"
            style={{ color: TEXT_MUTED }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = HOVER_BG
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = TEXT_MUTED
            }}
          >
            <LogOut size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}

/**
 * Picks white or near-black for text drawn on top of `bg`. Uses the
 * relative-luminance formula from WCAG to flip at the perceptual
 * midpoint rather than a naive HSL midpoint, so initials stay
 * legible on navy / cream / gold without manual tuning.
 *
 * Falls back to white for any colour string we can't parse — at
 * worst a chip looks dim, but no crash.
 */
function readableTextOn(bg: string): string {
  // Accepts `#rgb`, `#rrggbb`, or any string parseable into the
  // standard 6-char hex. Non-hex inputs (e.g. `rgb(...)` or named
  // colours) skip the calc and return white.
  let hex = bg.trim()
  if (hex.startsWith('#')) hex = hex.slice(1)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#FFFFFF'
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const srgb = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const lum = 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
  // 0.42 instead of 0.5 — empirically reads better for short text
  // on the kind of brand colours legal firms tend to pick (navy,
  // forest, burgundy all flip to white correctly).
  return lum > 0.42 ? '#0D1B2A' : '#FFFFFF'
}
