'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Scale, CheckSquare, FolderOpen, CalendarClock, UserPlus, FileText, Timer,
  Info, X, ListTodo, CalendarDays, Plus,
  ChevronDown, ChevronLeft, ChevronRight, HelpCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats } from '@/hooks/use-dashboard'
import type { DashboardStats } from '@/types'

const QUICK_ACTIONS = [
  { label: 'Add New Client',      Icon: UserPlus,  href: '/clients' },
  { label: 'Open New Case',       Icon: Scale,     href: '/cases' },
  { label: 'Generate Document',   Icon: FileText,  href: '/documents' },
  { label: 'Calculate Deadline',  Icon: Timer,     href: '/deadline' },
]

const TABS = [
  { id: 'personal', label: 'Personal Dashboard' },
  { id: 'firm',     label: 'Firm Dashboard' },
  { id: 'feed',     label: 'Firm Feed' },
] as const

type TabId = typeof TABS[number]['id']

const BANNER_DISMISSED_KEY = 'll:dash:onboarding-banner-dismissed'

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  const [bannerVisible, setBannerVisible] = useState(false)

  // Read the dismissed flag on mount (client-only to avoid SSR mismatch).
  useEffect(() => {
    if (typeof window === 'undefined') return
    setBannerVisible(window.localStorage.getItem(BANNER_DISMISSED_KEY) !== '1')
  }, [])

  const dismissBanner = () => {
    setBannerVisible(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BANNER_DISMISSED_KEY, '1')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--cream)' }}>
      {bannerVisible && <OnboardingBanner onDismiss={dismissBanner} />}

      <div className="px-6 pt-6">
        <TabBar active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="px-6 pb-6 pt-5">
        {activeTab === 'personal' && <PersonalDashboard stats={stats} isLoading={isLoading} />}
        {activeTab === 'firm'     && <FirmDashboard stats={stats} isLoading={isLoading} />}
        {activeTab === 'feed'     && <FirmFeed activity={stats?.recent_activity} isLoading={isLoading} />}
      </div>
    </div>
  )
}

// ── Onboarding Banner ──────────────────────────────────────────────────────

function OnboardingBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="relative flex items-center gap-3 pl-7 pr-6 py-3.5 border-b text-sm"
      style={{
        background: 'linear-gradient(90deg, rgba(201,151,43,0.14), rgba(201,151,43,0.06))',
        borderColor: 'rgba(201,151,43,0.30)',
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: 'var(--gold)' }}
      />

      <span
        className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
        style={{ background: 'rgba(201,151,43,0.18)' }}
      >
        <Info size={16} strokeWidth={2.25} style={{ color: 'var(--gold)' }} />
      </span>

      <p className="flex-1 text-[13.5px] leading-snug" style={{ color: 'var(--navy)' }}>
        <span className="font-bold">Welcome to LegaLite!</span>{' '}
        <Link href="/firm/settings" className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: 'var(--gold)' }}>
          Set up your firm name
        </Link>{' '}
        or{' '}
        <Link href="/team" className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: 'var(--gold)' }}>
          invite a teammate
        </Link>
.{' '}
        <Link href="/firm/billing" className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: 'var(--gold)' }}>
          Subscribe now
        </Link>
        .
      </p>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss onboarding banner"
        className="p-1 rounded hover:bg-black/5 transition-colors shrink-0"
        style={{ color: 'var(--navy)' }}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  )
}

// ── Tab Bar ────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="flex items-center gap-6 border-b" style={{ borderColor: 'var(--border)' }}>
      {TABS.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className="relative px-1 pb-3 text-sm font-semibold transition-colors"
            style={{ color: isActive ? 'var(--navy)' : '#6B7280' }}
          >
            {t.label}
            {isActive && (
              <span
                className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                style={{ background: 'var(--gold)' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Personal Dashboard tab ─────────────────────────────────────────────────

function PersonalDashboard({ stats, isLoading }: { stats: DashboardStats | undefined; isLoading: boolean }) {
  const personalCards = [
    { label: 'Your Clients',       value: stats?.personal_total_clients ?? 0,  Icon: Users,       bg: 'rgba(201,151,43,0.1)',  color: '#C9972B' },
    { label: 'Your Active Cases',  value: stats?.personal_active_cases ?? 0,   Icon: Scale,       bg: 'rgba(46,125,79,0.1)',   color: '#2E7D4F' },
    { label: 'Your Pending Tasks', value: stats?.personal_pending_tasks ?? 0,  Icon: CheckSquare, bg: 'rgba(192,57,43,0.08)',  color: '#C0392B' },
    { label: 'Your Invoices Due',  value: stats?.personal_invoices_due ?? 0,   Icon: FolderOpen,  bg: 'rgba(13,27,42,0.06)',   color: '#0D1B2A' },
  ]

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {personalCards.map((c) => <StatCard key={c.label} {...c} isLoading={isLoading} />)}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--navy)' }}>Today&rsquo;s Agenda</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AgendaCard
          count={0}
          label="Tasks Due Today"
          emptyMessage="You have no tasks due today"
          Icon={ListTodo}
          addHref="/tasks"
        />
        <AgendaCard
          count={0}
          label="Calendar Events"
          emptyMessage="You have no events scheduled for today"
          Icon={CalendarDays}
          addHref="/deadline"
        />
      </div>

      <div className="mt-8 rounded-xl border p-8 text-center" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>
          Hourly Metrics for you
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Track billable progress against a personal target. We&rsquo;ll plug in real numbers once your matters are populated.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-xs font-semibold"
          style={{ background: 'var(--navy)', color: 'white' }}
        >
          Set up your billing target
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  label, value, Icon, bg, color, isLoading,
}: {
  label: string
  value: number
  Icon: typeof Users
  bg: string
  color: string
  isLoading: boolean
}) {
  return (
    <div
      className="rounded-xl p-5 border transition-all hover:-translate-y-0.5"
      style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.07)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
        <Icon size={18} strokeWidth={1.75} style={{ color }} />
      </div>
      {isLoading
        ? <Skeleton className="h-9 w-16 mb-1" />
        : <div className="font-heading text-3xl font-extrabold" style={{ color: 'var(--navy)' }}>{value}</div>}
      <div className="text-[11px] mt-1 font-semibold uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  )
}

function AgendaCard({
  count, label, emptyMessage, Icon, addHref,
}: {
  count: number
  label: string
  emptyMessage: string
  Icon: typeof ListTodo
  addHref: string
}) {
  return (
    <div className="rounded-xl border p-5 flex items-center gap-5" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3">
        <span className="font-heading text-3xl font-extrabold" style={{ color: 'var(--navy)' }}>{count}</span>
        <Link
          href={addHref}
          aria-label={`Add ${label}`}
          className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors hover:bg-black/5"
          style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
        >
          <Plus size={14} strokeWidth={2.25} />
        </Link>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={14} strokeWidth={1.75} style={{ color: 'var(--navy)' }} />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        </div>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    </div>
  )
}

// ── Firm Dashboard tab ─────────────────────────────────────────────────────

function FirmDashboard({ stats, isLoading }: { stats: DashboardStats | undefined; isLoading: boolean }) {
  const statCards = [
    { label: 'Total Clients',  value: stats?.total_clients ?? 0,       Icon: Users,       bg: 'rgba(201,151,43,0.1)',  color: '#C9972B' },
    { label: 'Active Cases',   value: stats?.active_cases ?? 0,        Icon: Scale,       bg: 'rgba(46,125,79,0.1)',   color: '#2E7D4F' },
    { label: 'Pending Tasks',  value: stats?.pending_tasks ?? 0,       Icon: CheckSquare, bg: 'rgba(192,57,43,0.08)',  color: '#C0392B' },
    { label: 'Invoices Due',   value: stats?.total_invoices_due ?? 0,  Icon: FolderOpen,  bg: 'rgba(13,27,42,0.06)',   color: '#0D1B2A' },
  ]

  return (
    <div>
      <FirmOverview />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((c) => <StatCard key={c.label} {...c} isLoading={isLoading} />)}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border overflow-hidden" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.07)' }}>
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-0">
            <CalendarClock size={16} strokeWidth={1.75} style={{ color: 'var(--navy)' }} />
            <span className="font-heading text-base font-bold" style={{ color: 'var(--navy)' }}>Upcoming Court Dates</span>
          </div>
          <div className="p-5">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !stats?.upcoming_dates?.length ? (
              <p className="text-sm text-gray-400">No upcoming dates. Add cases to track them.</p>
            ) : (
              <div className="space-y-2">
                {stats.upcoming_dates.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg px-4 py-3 border" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>{item.title}</div>
                      <div className="text-xs text-gray-500">{item.client_name} | {item.court ?? 'No court'}</div>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>{new Date(item.next_court_date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.07)' }}>
          <div className="px-5 pt-5 pb-0">
            <span className="font-heading text-base font-bold" style={{ color: 'var(--navy)' }}>Quick Actions</span>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {QUICK_ACTIONS.map(({ label, Icon, href }) => (
              <Link key={label} href={href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all hover:border-yellow-600 hover:bg-amber-50" style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}>
                <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--gold)' }} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Firm Overview (Utilisation) ────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const Y_TICKS = [1, 0.8, 0.6, 0.4, 0.2, 0]
const UTILISATION_COLORS = {
  billable:    '#0D1B2A',  // navy
  nonBillable: '#9CA3AF',  // gray-400
  untracked:   '#C0392B',  // muted red
}
const UNIT_OPTIONS = [
  { id: 'hr',  label: 'Hr.' },
  { id: 'ghs', label: 'GHS' },
  { id: 'pct', label: '%' },
] as const
type UnitId = typeof UNIT_OPTIONS[number]['id']

function FirmOverview() {
  const [year, setYear] = useState(2026)
  const [unit, setUnit] = useState<UnitId>('hr')
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="mb-6">
      {/* Header row */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--navy)' }}>Firm overview</h2>
          <p className="text-xs text-gray-500 mt-1">Data last refreshed 4 hours ago (05/20/2026 10:00 PM GMT)</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill>GHS (GH) <ChevronDown size={12} strokeWidth={2.25} /></Pill>
          <Pill>All users <ChevronDown size={12} strokeWidth={2.25} /></Pill>
          <div className="flex items-center rounded-md border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--cream-white)' }}>
            <button type="button" onClick={() => setYear((y) => y - 1)} aria-label="Previous year" className="px-2 py-1.5 hover:bg-black/5 transition-colors">
              <ChevronLeft size={14} strokeWidth={2} style={{ color: 'var(--navy)' }} />
            </button>
            <span className="px-3 text-sm font-semibold" style={{ color: 'var(--navy)' }}>{year}</span>
            <button type="button" onClick={() => setYear((y) => y + 1)} aria-label="Next year" className="px-2 py-1.5 hover:bg-black/5 transition-colors">
              <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--navy)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Utilisation card */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.07)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.025)' }}>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="flex items-center gap-2">
            <ChevronDown size={16} strokeWidth={2.25} style={{ color: 'var(--navy)', transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 180ms ease' }} />
            <span className="font-heading text-base font-bold" style={{ color: 'var(--navy)' }}>Utilisation</span>
            <HelpCircle size={13} strokeWidth={2} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Activities dated <span className="font-semibold" style={{ color: 'var(--navy)' }}>Jan 1 – May 21, {year}</span></span>
            <HelpCircle size={12} strokeWidth={2} className="text-gray-400" />
          </div>
        </div>

        {expanded && (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
            {/* Left: Rate average + Totals */}
            <div className="p-5 border-r" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rate average</span>
                <HelpCircle size={12} strokeWidth={2} className="text-gray-400" />
              </div>
              <div className="h-24 flex items-center justify-center">
                <p className="text-xs text-gray-400 text-center">You have no data to display for this period</p>
              </div>

              <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Totals</span>
                  <HelpCircle size={12} strokeWidth={2} className="text-gray-400" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TotalsMini label="Billable"     color={UTILISATION_COLORS.billable} />
                  <TotalsMini label="Non-billable" color={UTILISATION_COLORS.nonBillable} />
                  <TotalsMini label="Untracked"    color={UTILISATION_COLORS.untracked} />
                </div>
              </div>
            </div>

            {/* Right: Monthly chart */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Monthly</span>
                <div className="flex items-center rounded-md border overflow-hidden text-[11px] font-semibold" style={{ borderColor: 'var(--border)' }}>
                  {UNIT_OPTIONS.map((opt) => {
                    const active = opt.id === unit
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setUnit(opt.id)}
                        className="px-3 py-1.5 transition-colors"
                        style={{
                          background: active ? 'var(--navy)' : 'transparent',
                          color: active ? 'white' : 'var(--navy)',
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Chart area */}
              <div className="relative h-56">
                <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-gray-400 text-right pr-2">
                  {Y_TICKS.map((t) => <span key={t}>{t}</span>)}
                </div>
                <div className="absolute left-8 right-0 top-0 bottom-6 border-l border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {Y_TICKS.map((t, i) => <div key={i} className="border-t" style={{ borderColor: i === Y_TICKS.length - 1 ? 'transparent' : 'rgba(13,27,42,0.04)' }} />)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs text-gray-400">You have no data to display for this period</p>
                  </div>
                </div>
                <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-gray-400">
                  {MONTHS.map((m) => (
                    <span key={m} className="flex flex-col items-center leading-tight">
                      <span>{m}</span>
                      <span>{year}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-5 grid grid-cols-3 gap-x-6 gap-y-1 text-[10px] uppercase tracking-wider text-gray-500">
                <LegendSwatch color={UTILISATION_COLORS.billable}    label="Billable" />
                <LegendSwatch color={UTILISATION_COLORS.nonBillable} label="Non-billable" />
                <LegendSwatch color={UTILISATION_COLORS.untracked}   label="Untracked" />
                <LegendSwatch color={UTILISATION_COLORS.billable}    label={`${year - 1} Billable`}    dashed />
                <LegendSwatch color={UTILISATION_COLORS.nonBillable} label={`${year - 1} Non-billable`} dashed />
                <LegendSwatch color={UTILISATION_COLORS.untracked}   label={`${year - 1} Untracked`}   dashed />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5"
      style={{ borderColor: 'var(--border)', background: 'var(--cream-white)', color: 'var(--navy)' }}
    >
      {children}
    </button>
  )
}

function TotalsMini({ label, color }: { label: string; color: string }) {
  return (
    <div className="relative pl-3">
      <span aria-hidden className="absolute left-0 top-0.5 bottom-0.5 w-[3px] rounded-full" style={{ background: color }} />
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="font-heading text-2xl font-extrabold leading-tight" style={{ color: 'var(--navy)' }}>—</div>
    </div>
  )
}

function LegendSwatch({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-3 h-3 rounded-sm"
        style={{
          background: dashed ? 'transparent' : color,
          border: dashed ? `1.5px dashed ${color}` : 'none',
        }}
      />
      <span className="truncate">{label}</span>
    </span>
  )
}

// ── Firm Feed tab ──────────────────────────────────────────────────────────

function FirmFeed({ activity, isLoading }: { activity: DashboardStats['recent_activity'] | undefined; isLoading: boolean }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.07)' }}>
      <div className="px-5 pt-5 pb-0">
        <span className="font-heading text-base font-bold" style={{ color: 'var(--navy)' }}>Activity across the firm</span>
        <p className="text-xs text-gray-500 mt-1">Live stream of every member action. Filtering and richer item types will land in the next pass.</p>
      </div>
      <div className="p-5">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !activity?.length ? (
          <p className="text-sm text-gray-400">No activity yet. As members work, their actions will appear here.</p>
        ) : (
          <div className="space-y-2">
            {activity.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--navy)' }}>{item.title}</span>
                  <span className="text-gray-400 ml-2 text-xs uppercase tracking-wider">{item.type}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
