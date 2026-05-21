'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Scale, CheckSquare, FolderOpen, CalendarClock, UserPlus, FileText, Timer,
  Info, X, ListTodo, CalendarDays, Plus,
  ChevronDown, ChevronLeft, ChevronRight, HelpCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { useDashboardStats } from '@/hooks/use-dashboard'
import type { DashboardStats } from '@/types'

const QUICK_ACTIONS = [
  { label: 'Add new client', Icon: UserPlus, href: '/clients' },
  { label: 'Open new case', Icon: Scale, href: '/cases' },
  { label: 'Generate document', Icon: FileText, href: '/documents' },
  { label: 'Calculate deadline', Icon: Timer, href: '/deadline' },
]

const TABS = [
  { id: 'personal', label: 'Personal' },
  { id: 'firm', label: 'Firm' },
  { id: 'feed', label: 'Activity' },
] as const

type TabId = typeof TABS[number]['id']

const BANNER_DISMISSED_KEY = 'll:dash:onboarding-banner-dismissed'

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  const [bannerVisible, setBannerVisible] = useState(false)

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
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <DashboardHeader />

        {bannerVisible && (
          <div className="mt-6">
            <OnboardingBanner onDismiss={dismissBanner} />
          </div>
        )}

        <div className="mt-7">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-6">
          {activeTab === 'personal' && <PersonalDashboard stats={stats} isLoading={isLoading} />}
          {activeTab === 'firm' && <FirmDashboard stats={stats} isLoading={isLoading} />}
          {activeTab === 'feed' && <FirmFeed activity={stats?.recent_activity} isLoading={isLoading} />}
        </div>
      </div>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────────────────────

function DashboardHeader() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <h1
          className="font-heading text-[28px] font-semibold leading-tight tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {today}
        </p>
      </div>
    </div>
  )
}

// ── Onboarding banner (restrained) ─────────────────────────────────────────

function OnboardingBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="relative flex items-start gap-3 rounded-xl border pl-5 pr-4 py-3.5"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
        style={{ background: 'var(--gold)' }}
      />
      <Info size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
      <p
        className="flex-1 text-[13px] leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Welcome to LegaLite.
        </span>{' '}
        <Link
          href="/firm/settings"
          className="font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--gold)' }}
        >
          Set up your firm
        </Link>
        ,{' '}
        <Link
          href="/team"
          className="font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--gold)' }}
        >
          invite a teammate
        </Link>
        , or{' '}
        <Link
          href="/firm/billing"
          className="font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--gold)' }}
        >
          subscribe
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded p-1 transition-colors hover:bg-black/5 shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}

// ── Tab bar ────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div
      className="flex items-center gap-7 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className="relative px-0.5 pb-3 text-[13.5px] font-medium transition-colors"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {t.label}
            {isActive && (
              <span
                aria-hidden
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

// ── Personal ───────────────────────────────────────────────────────────────

function PersonalDashboard({ stats, isLoading }: { stats: DashboardStats | undefined; isLoading: boolean }) {
  return (
    <div className="space-y-6">

      <section>
        <SectionHeading title="Today’s agenda" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <AgendaCard count={0} label="Tasks due today" emptyMessage="No tasks due today" Icon={ListTodo} addHref="/tasks" />
          <AgendaCard count={0} label="Calendar events" emptyMessage="No events scheduled today" Icon={CalendarDays} addHref="/deadline" />
        </div>
      </section>

      <Card variant="default" padding="lg">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <CardTitle className="text-base">Track your billable progress</CardTitle>
            <CardDescription className="mt-1">
              Set a personal hourly target — we’ll surface utilisation here once matters are populated.
            </CardDescription>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors hover:opacity-90 shrink-0"
            style={{ background: 'var(--navy)', color: 'white' }}
          >
            Set target
          </Link>
        </div>
      </Card>
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
    <Card padding="lg">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <span
            className="font-heading text-[28px] font-semibold leading-none tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {count}
          </span>
          <Link
            href={addHref}
            aria-label={`Add ${label}`}
            className="w-6 h-6 rounded-full flex items-center justify-center border transition-colors hover:bg-black/5"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
            <Plus size={12} strokeWidth={2} />
          </Link>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Icon size={13} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
            <span
              className="text-[11.5px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {label}
            </span>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {emptyMessage}
          </p>
        </div>
      </div>
    </Card>
  )
}

// ── Firm ───────────────────────────────────────────────────────────────────

function FirmDashboard({ stats, isLoading }: { stats: DashboardStats | undefined; isLoading: boolean }) {
  const statCards = [
    { label: 'Total clients', value: stats?.total_clients ?? 0, Icon: Users },
    { label: 'Active cases', value: stats?.active_cases ?? 0, Icon: Scale },
    { label: 'Pending tasks', value: stats?.pending_tasks ?? 0, Icon: CheckSquare },
    { label: 'Invoices due', value: stats?.total_invoices_due ?? 0, Icon: FolderOpen },
  ]

  return (
    <div className="space-y-6">
      <FirmOverview />

      <div className="grid grid-cols-3 gap-4">
        <Card padding="none" className="col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              <CardTitle className="text-base">Upcoming court dates</CardTitle>
            </div>
            <Link
              href="/deadline"
              className="text-[12.5px] font-medium hover:underline underline-offset-2"
              style={{ color: 'var(--text-muted)' }}
            >
              View all
            </Link>
          </div>
          <div className="px-3 pb-3">
            {isLoading ? (
              <div className="px-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !stats?.upcoming_dates?.length ? (
              <p className="px-3 pb-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                No upcoming dates. Add cases to track them.
              </p>
            ) : (
              <ul className="flex flex-col">
                {stats.upcoming_dates.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--surface-overlay)]"
                  >
                    <div className="min-w-0">
                      <div
                        className="text-[13.5px] font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.title}
                      </div>
                      <div className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {item.client_name} · {item.court ?? 'No court'}
                      </div>
                    </div>
                    <div
                      className="text-[12.5px] font-medium tabular-nums shrink-0"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {new Date(item.next_court_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <div className="px-6 pt-5 pb-3">
            <CardTitle className="text-base">Quick actions</CardTitle>
          </div>
          <div className="px-3 pb-3 flex flex-col">
            {QUICK_ACTIONS.map(({ label, Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-[var(--surface-overlay)]"
                style={{ color: 'var(--text-primary)' }}
              >
                <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Firm overview / utilisation ────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const Y_TICKS = [1, 0.8, 0.6, 0.4, 0.2, 0]
const UTILISATION_COLORS = {
  billable: '#0D1B2A',
  nonBillable: '#9CA3AF',
  untracked: '#C0392B',
}
const UNIT_OPTIONS = [
  { id: 'hr', label: 'Hr.' },
  { id: 'ghs', label: 'GHS' },
  { id: 'pct', label: '%' },
] as const
type UnitId = typeof UNIT_OPTIONS[number]['id']

function FirmOverview() {
  const [year, setYear] = useState(2026)
  const [unit, setUnit] = useState<UnitId>('hr')
  const [expanded, setExpanded] = useState(true)

  return (
    <section>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <SectionHeading title="Firm overview" />
          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Data last refreshed 4 hours ago · 05/20/2026 10:00 PM GMT
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill>GHS (GH) <ChevronDown size={12} strokeWidth={2} /></Pill>
          <Pill>All users <ChevronDown size={12} strokeWidth={2} /></Pill>
          <div
            className="flex items-center rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
          >
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              aria-label="Previous year"
              className="px-2 py-1.5 hover:bg-black/5 transition-colors"
            >
              <ChevronLeft size={13} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <span className="px-3 text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {year}
            </span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              aria-label="Next year"
              className="px-2 py-1.5 hover:bg-black/5 transition-colors"
            >
              <ChevronRight size={13} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-3.5 border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <button type="button" onClick={() => setExpanded((v) => !v)} className="flex items-center gap-2">
            <ChevronDown
              size={15}
              strokeWidth={2}
              style={{
                color: 'var(--text-secondary)',
                transform: expanded ? 'none' : 'rotate(-90deg)',
                transition: 'transform 180ms ease',
              }}
            />
            <span className="font-heading text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Utilisation
            </span>
            <HelpCircle size={12} strokeWidth={1.75} style={{ color: 'var(--text-subtle)' }} />
          </button>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            <span>
              Activities dated{' '}
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                Jan 1 – May 21, {year}
              </span>
            </span>
            <HelpCircle size={12} strokeWidth={1.75} style={{ color: 'var(--text-subtle)' }} />
          </div>
        </div>

        {expanded && (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
            <div className="p-6 border-r" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Rate average
                </span>
                <HelpCircle size={11} strokeWidth={1.75} style={{ color: 'var(--text-subtle)' }} />
              </div>
              <div className="h-24 flex items-center justify-center">
                <p className="text-[12px] text-center" style={{ color: 'var(--text-muted)' }}>
                  You have no data to display for this period
                </p>
              </div>

              <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <span
                    className="text-[11px] font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Totals
                  </span>
                  <HelpCircle size={11} strokeWidth={1.75} style={{ color: 'var(--text-subtle)' }} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TotalsMini label="Billable" color={UTILISATION_COLORS.billable} />
                  <TotalsMini label="Non-billable" color={UTILISATION_COLORS.nonBillable} />
                  <TotalsMini label="Untracked" color={UTILISATION_COLORS.untracked} />
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Monthly
                </span>
                <div
                  className="flex items-center rounded-lg border overflow-hidden text-[11px] font-medium"
                  style={{ borderColor: 'var(--border-default)' }}
                >
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
                          color: active ? 'white' : 'var(--text-secondary)',
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="relative h-56">
                <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-right pr-2" style={{ color: 'var(--text-subtle)' }}>
                  {Y_TICKS.map((t) => <span key={t}>{t}</span>)}
                </div>
                <div
                  className="absolute left-8 right-0 top-0 bottom-6 border-l border-b"
                  style={{ borderColor: 'var(--border-soft)' }}
                >
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {Y_TICKS.map((t, i) => (
                      <div
                        key={i}
                        className="border-t"
                        style={{
                          borderColor: i === Y_TICKS.length - 1 ? 'transparent' : 'var(--border-soft)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      You have no data to display for this period
                    </p>
                  </div>
                </div>
                <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px]" style={{ color: 'var(--text-subtle)' }}>
                  {MONTHS.map((m) => (
                    <span key={m} className="flex flex-col items-center leading-tight">
                      <span>{m}</span>
                      <span>{year}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="mt-5 grid grid-cols-3 gap-x-6 gap-y-1.5 text-[10px] uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                <LegendSwatch color={UTILISATION_COLORS.billable} label="Billable" />
                <LegendSwatch color={UTILISATION_COLORS.nonBillable} label="Non-billable" />
                <LegendSwatch color={UTILISATION_COLORS.untracked} label="Untracked" />
                <LegendSwatch color={UTILISATION_COLORS.billable} label={`${year - 1} billable`} dashed />
                <LegendSwatch color={UTILISATION_COLORS.nonBillable} label={`${year - 1} non-billable`} dashed />
                <LegendSwatch color={UTILISATION_COLORS.untracked} label={`${year - 1} untracked`} dashed />
              </div>
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-black/5"
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--surface-card)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </button>
  )
}

function TotalsMini({ label, color }: { label: string; color: string }) {
  return (
    <div className="relative pl-3">
      <span
        aria-hidden
        className="absolute left-0 top-0.5 bottom-0.5 w-[2px] rounded-full"
        style={{ background: color }}
      />
      <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className="font-heading text-[22px] font-semibold leading-tight tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        —
      </div>
    </div>
  )
}

function LegendSwatch({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-sm"
        style={{
          background: dashed ? 'transparent' : color,
          border: dashed ? `1.5px dashed ${color}` : 'none',
        }}
      />
      <span className="truncate">{label}</span>
    </span>
  )
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2
      className="font-heading text-lg font-semibold tracking-tight"
      style={{ color: 'var(--text-primary)' }}
    >
      {title}
    </h2>
  )
}

// ── Activity feed ──────────────────────────────────────────────────────────

function FirmFeed({ activity, isLoading }: { activity: DashboardStats['recent_activity'] | undefined; isLoading: boolean }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-6 pt-5 pb-4">
        <CardTitle className="text-base">Activity across the firm</CardTitle>
        <CardDescription className="mt-1">
          Live stream of every member action. Filtering lands in the next pass.
        </CardDescription>
      </div>
      <div className="px-3 pb-3">
        {isLoading ? (
          <div className="px-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !activity?.length ? (
          <p className="px-3 pb-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            No activity yet. As members work, their actions will appear here.
          </p>
        ) : (
          <ul className="flex flex-col">
            {activity.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--surface-overlay)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
                    style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
                  >
                    {item.type}
                  </span>
                  <span
                    className="text-[13.5px] truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.title}
                  </span>
                </div>
                <span className="text-[12px] tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {new Date(item.created_at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
