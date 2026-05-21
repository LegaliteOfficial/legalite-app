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
      { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard',      href: '/dashboard' },
      { id: 'clients',   Icon: Users,           label: 'Clients',        href: '/clients' },
      { id: 'cases',     Icon: Scale,           label: 'Cases',          href: '/cases' },
      { id: 'tasks',     Icon: CheckSquare,     label: 'Tasks',          href: '/tasks' },
      { id: 'documents', Icon: FileText,        label: 'Documents',      href: '/documents' },
      { id: 'deadline',  Icon: Timer,           label: 'Deadline Engine',href: '/deadline' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'ai',      Icon: Sparkles,      label: 'AI Assistant', href: '/ai' },
      { id: 'comms',   Icon: MessageSquare, label: 'Client Comms', href: '/comms' },
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
      style={{ width: 256, background: 'var(--navy)' }}
      className="flex flex-col flex-shrink-0 h-full relative overflow-hidden"
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.06]">
        <h1
          className="font-heading text-2xl font-extrabold"
          style={{ color: 'var(--gold-light)', letterSpacing: '-0.5px' }}
        >
          LegaLite
        </h1>
        <p className="text-[10.5px] mt-0.5 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Legal Practice Management
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3.5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div
              className="text-[10px] font-bold tracking-[1.5px] uppercase px-3 py-2 mt-2"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.Icon
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-[15px] font-medium transition-all duration-150 border border-transparent"
                  style={{
                    color: isActive ? 'var(--gold-light)' : 'rgba(255,255,255,0.52)',
                    background: isActive
                      ? 'linear-gradient(135deg,rgba(201,151,43,0.22),rgba(201,151,43,0.08))'
                      : 'transparent',
                    borderColor: isActive ? 'rgba(201,151,43,0.28)' : 'transparent',
                  }}
                >
                  <Icon size={15} strokeWidth={isActive ? 2 : 1.75} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-2.5 border-t border-white/[0.06]">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))',
              color: 'var(--navy)',
            }}
          >
            {initials}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {user?.name}
            </div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.32)' }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md transition-colors cursor-pointer flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            title="Sign out"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
