'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import {
  LayoutDashboard,
  Users,
  Scale,
  CheckSquare,
  FileText,
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
      { id: 'documents', Icon: FileText,        label: 'Documents',       href: '/documents' },
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
      style={{ width: 248, background: 'transparent' }}
      className="flex flex-col shrink-0 h-full relative overflow-hidden rounded-2xl"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <h1
          className="font-heading text-[22px] font-semibold tracking-tight"
          style={{ color: 'var(--gold-light)' }}
        >
          LegaLite
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {NAV_GROUPS.map((group, idx) => (
          <div key={group.label} className={idx === 0 ? '' : 'mt-6'}>
            <div
              className="px-2 pb-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em]"
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
                      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium transition-colors"
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
              className="text-[13px] font-medium truncate"
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
