import {
  SquaresFour,
  Users,
  Scales,
  CheckSquare,
  IdentificationCard,
  FileText,
  Calendar as CalendarIcon,
  Timer,
  Sparkle,
  CreditCard,
  Gear,
  type Icon,
} from '@phosphor-icons/react'

/**
 * App navigation — single source for the desktop sidebar, the mobile
 * drawer, the mobile top bar and the mobile tab bar.
 */

export interface NavItem {
  id: string
  Icon: Icon
  label: string
  href: string
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'dashboard', Icon: SquaresFour, label: 'Dashboard', href: '/dashboard' },
      { id: 'clients', Icon: Users, label: 'Clients', href: '/clients' },
      { id: 'cases', Icon: Scales, label: 'Cases', href: '/cases' },
      { id: 'tasks', Icon: CheckSquare, label: 'Tasks', href: '/tasks' },
      { id: 'contacts', Icon: IdentificationCard, label: 'Contacts', href: '/contacts' },
      { id: 'documents', Icon: FileText, label: 'Documents', href: '/documents' },
      { id: 'calendar', Icon: CalendarIcon, label: 'Calendar', href: '/calendar' },
      { id: 'deadline', Icon: Timer, label: 'Deadline engine', href: '/deadline' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'ai', Icon: Sparkle, label: 'AI assistant', href: '/ai' },
      { id: 'billing', Icon: CreditCard, label: 'Billing', href: '/billing' },
    ],
  },
  {
    label: 'Account',
    items: [{ id: 'settings', Icon: Gear, label: 'Settings', href: '/settings' }],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

/** Destinations pinned to the mobile tab bar (the rest live under "More"). */
export const TAB_BAR_IDS = ['dashboard', 'cases', 'tasks', 'calendar'] as const

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

/** The nav item a path belongs to, if any. */
export function navItemFor(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((i) => isNavActive(pathname, i.href))
}
