'use client'

/**
 * Hero product demo. A coded, light-theme replica of the LegaLite workspace
 * that cycles through three real surfaces (matters, billing, research) so
 * visitors see the product itself rather than an abstract graphic. Built in
 * markup instead of a video so it stays sharp at every size and reflows on
 * phones. Auto-rotation pauses on hover and is disabled entirely when the
 * visitor prefers reduced motion.
 */

import { useEffect, useState, useSyncExternalStore } from 'react'

const VIEWS = [
  { id: 'matters', label: 'Matters' },
  { id: 'billing', label: 'Billing' },
  { id: 'research', label: 'Research' },
] as const

type ViewId = (typeof VIEWS)[number]['id']

const ROTATION_MS = 5200

const SIDEBAR_ITEMS: { label: string; view: ViewId | null }[] = [
  { label: 'Dashboard', view: null },
  { label: 'Cases', view: 'matters' },
  { label: 'Clients', view: null },
  { label: 'Documents', view: null },
  { label: 'Deadline engine', view: null },
  { label: 'AI assistant', view: 'research' },
  { label: 'Billing', view: 'billing' },
]

const MATTERS = [
  { name: 'Republic v. Osei', ref: 'CIV-2401', next: 'Hearing, 2 Oct', status: 'Open' },
  { name: 'Ansah Family Trust', ref: 'PRB-1187', next: 'Filing, 29 Sep', status: 'Pending' },
  { name: 'Mensah v. GRA', ref: 'TAX-0932', next: 'Mention, 7 Oct', status: 'Open' },
  { name: 'Adjei Holdings merger', ref: 'CORP-0554', next: 'Closing memo', status: 'Closed' },
]

const STATUS_STYLE: Record<string, string> = {
  Open: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Pending: 'text-amber-700 bg-amber-50 border-amber-200',
  Closed: 'text-gray-500 bg-gray-100 border-gray-200',
}

const UNBILLED = [
  { client: 'Ansah Family Trust', entries: 6, hours: '7.5h', amount: 'GHS 5,625' },
  { client: 'Mensah v. GRA', entries: 3, hours: '4.0h', amount: 'GHS 3,000' },
  { client: 'Adjei Holdings', entries: 9, hours: '11.2h', amount: 'GHS 8,400' },
]

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )
}

function useTicker(active: boolean, startSeconds: number) {
  const [seconds, setSeconds] = useState(startSeconds)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [active])
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function HeroProductDemo() {
  const reducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const view = VIEWS[index].id
  const timer = useTicker(!reducedMotion, 5076)

  useEffect(() => {
    if (reducedMotion || paused) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % VIEWS.length), ROTATION_MS)
    return () => clearTimeout(id)
  }, [index, paused, reducedMotion])

  return (
    <div
      className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8F4EE] text-[#0D1B2A] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-black/5 bg-white/70 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        </div>
        <div className="mx-auto truncate rounded-md bg-black/[0.04] px-3 py-1 text-[11px] text-gray-500">
          app.legalite.app/{view === 'matters' ? 'cases' : view === 'billing' ? 'billing' : 'ai'}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-48 shrink-0 bg-[#0D1B2A] px-4 py-5 md:block" aria-hidden>
          <div className="[font-family:Literata,'Times_New_Roman',serif] text-lg font-semibold text-[#C9972B]">
            LegaLite
          </div>
          <div className="mt-6 flex flex-col gap-1">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = item.view === view
              return (
                <div
                  key={item.label}
                  className={`rounded-md px-2.5 py-1.5 text-xs transition-colors duration-500 ${
                    isActive ? 'bg-[#C9972B]/15 text-[#E8B84B]' : 'text-white/55'
                  }`}
                >
                  {item.label}
                </div>
              )
            })}
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <div
            role="tablist"
            aria-label="Product views"
            className="flex gap-1 rounded-lg bg-black/[0.04] p-1 text-xs w-fit"
          >
            {VIEWS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                className={`rounded-md px-3 py-1.5 transition ${
                  i === index ? 'bg-white text-[#0D1B2A] shadow-sm' : 'text-gray-500 hover:text-[#0D1B2A]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div key={view} className="mt-5 min-h-[330px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 sm:min-h-[300px]">
            {view === 'matters' && <MattersView />}
            {view === 'billing' && <BillingView timer={timer} />}
            {view === 'research' && <ResearchView />}
          </div>
        </div>
      </div>
    </div>
  )
}

function MattersView() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Active matters', value: '18' },
          { label: 'Due this week', value: '5' },
          { label: 'Unbilled', value: 'GHS 17k' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-black/5 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="truncate text-[9px] uppercase tracking-wide text-gray-400 sm:text-[10px]">{s.label}</div>
            <div className="mt-1 text-sm font-semibold sm:text-base">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="flex items-center gap-3 border-b border-black/5 px-4 py-2.5 text-[10px] uppercase tracking-wide text-gray-400">
          <div className="flex-1">Matter</div>
          <div className="hidden w-20 sm:block">Reference</div>
          <div className="hidden w-28 lg:block">Next date</div>
          <div className="w-16 text-right">Status</div>
        </div>
        {MATTERS.map((m) => (
          <div key={m.name} className="flex items-center gap-3 border-b border-black/[0.03] px-4 py-3 text-sm last:border-0">
            <div className="min-w-0 flex-1 truncate font-medium">{m.name}</div>
            <div className="hidden w-20 text-xs text-gray-400 sm:block">{m.ref}</div>
            <div className="hidden w-28 text-xs text-gray-500 lg:block">{m.next}</div>
            <div className="w-16 text-right">
              <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[m.status]}`}>
                {m.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BillingView({ timer }: { timer: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <div className="rounded-xl border border-[#C9972B]/30 bg-white p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-gray-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Timer running
        </div>
        <div className="mt-2 text-sm font-medium">Ansah Family Trust</div>
        <div className="text-xs text-gray-400">PRB-1187 &middot; Drafting probate petition</div>
        <div className="mt-4 font-mono text-2xl font-semibold tabular-nums sm:text-3xl">{timer}</div>
        <div className="mt-1 text-xs text-gray-500">GHS 750 / hour &middot; logged to the matter</div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
          <span className="text-[10px] uppercase tracking-wide text-gray-400">Unbilled time</span>
          <span className="rounded-md bg-[#0D1B2A] px-2.5 py-1 text-[10px] font-medium text-white">Create invoice</span>
        </div>
        {UNBILLED.map((u) => (
          <div key={u.client} className="flex items-center gap-3 border-b border-black/[0.03] px-4 py-3 text-sm last:border-0">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{u.client}</div>
              <div className="text-xs text-gray-400">
                {u.entries} entries &middot; {u.hours}
              </div>
            </div>
            <div className="text-sm font-semibold tabular-nums">{u.amount}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResearchView() {
  return (
    <div className="flex flex-col gap-3">
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#0D1B2A] px-4 py-3 text-sm text-white">
        What is the limitation period for a claim on a simple contract?
      </div>
      <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-black/5 bg-white px-4 py-3 text-sm leading-relaxed">
        <p>
          Six years from the date the cause of action accrued. An action founded on a
          simple contract cannot be brought after that period expires.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-md border border-[#C9972B]/30 bg-[#C9972B]/[0.08] px-2 py-1 text-[11px] text-[#8C6A1E]">
            Limitation Act, 1972 (NRCD 54), s. 4(1)(a)
          </span>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-3 text-xs text-gray-400">
        Ask about a statute, judgment, or precedent
      </div>
    </div>
  )
}
