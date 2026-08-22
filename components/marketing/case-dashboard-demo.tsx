'use client'

/**
 * Animated light-theme case dashboard for the case management hero. A cursor
 * loops between five targets (search, New case, a filter, the Open tab, a
 * matter row) and clicks each with a press effect and ripple. Target positions
 * are measured from the live DOM so the cursor stays aligned across breakpoints.
 */

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { label: 'Active matters', value: '18' },
  { label: 'Due this week', value: '5' },
  { label: 'Unbilled', value: 'GHS 42k' },
]

const ROWS = [
  { name: 'Republic v. Osei', ref: 'CIV-2401', who: 'KA', tone: '#C9972B', status: 'Open' },
  { name: 'Ansah Family Trust', ref: 'PRB-1187', who: 'FM', tone: '#2F6BFF', status: 'Pending' },
  { name: 'Mensah v. GRA', ref: 'TAX-0932', who: 'AO', tone: '#0D1B2A', status: 'Open' },
  { name: 'Adjei Holdings merger', ref: 'CORP-0554', who: 'DK', tone: '#4B5563', status: 'Closed' },
]

const STATUS_STYLE: Record<string, string> = {
  Open: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Pending: 'text-amber-700 bg-amber-50 border-amber-200',
  Closed: 'text-gray-500 bg-gray-100 border-gray-200',
}

const ROW_TARGET = 1
const STEP_COUNT = 5

export function CaseDashboardDemo() {
  const container = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLDivElement>(null)
  const newCase = useRef<HTMLButtonElement>(null)
  const filter = useRef<HTMLButtonElement>(null)
  const tab = useRef<HTMLButtonElement>(null)
  const row = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState(0)
  const [clicking, setClicking] = useState(false)
  const [pos, setPos] = useState({ x: 60, y: 40 })

  useEffect(() => {
    const targets = [search, newCase, filter, tab, row]
    let alive = true
    let i = 0
    let clickTimer: ReturnType<typeof setTimeout>

    const measure = (idx: number) => {
      const c = container.current
      const t = targets[idx].current
      if (!c || !t) return null
      const cr = c.getBoundingClientRect()
      const tr = t.getBoundingClientRect()
      return {
        x: tr.left - cr.left + tr.width / 2,
        y: tr.top - cr.top + tr.height / 2,
      }
    }

    const first = measure(0)
    if (first) setPos(first)

    const advance = () => {
      if (!alive) return
      i = (i + 1) % targets.length
      setStep(i)
      const p = measure(i)
      if (p) setPos(p)
      clickTimer = setTimeout(() => {
        if (!alive) return
        setClicking(true)
        setTimeout(() => alive && setClicking(false), 320)
      }, 700)
    }

    const id = setInterval(advance, 1900)
    return () => {
      alive = false
      clearInterval(id)
      clearTimeout(clickTimer)
    }
  }, [])

  const active = (idx: number) => step === idx
  const pressed = (idx: number) => step === idx && clicking

  return (
    <div
      ref={container}
      className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-6 text-[#0D1B2A] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Cases</div>
          <div className="mt-0.5 text-xs text-gray-400">18 active matters</div>
        </div>
        <div className="flex items-center gap-2">
          <div
            ref={search}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs text-gray-400 transition ${
              active(0) ? 'border-[#C9972B]/50 ring-2 ring-[#C9972B]/20' : 'border-gray-200'
            } ${pressed(0) ? 'scale-[0.98]' : ''}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Search matters</span>
          </div>
          <button
            ref={newCase}
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-md bg-gradient-to-b from-[#C9972B] to-[#8C6A1E] px-3.5 py-2 text-xs font-medium text-white transition ${
              active(1) ? 'ring-2 ring-[#C9972B]/40' : ''
            } ${pressed(1) ? 'scale-95 brightness-110' : ''}`}
          >
            <span className="text-sm leading-none">+</span> New case
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wide text-gray-400">{s.label}</div>
            <div className="mt-1 text-base font-semibold text-[#0D1B2A]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar: tabs + filter */}
      <div className="mt-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs">
          {['All', 'Open', 'Pending', 'Closed'].map((t) => {
            const isTarget = t === 'Open'
            return (
              <button
                key={t}
                ref={isTarget ? tab : undefined}
                type="button"
                className={`rounded-md px-3 py-1.5 transition ${
                  isTarget && active(3)
                    ? 'bg-[#C9972B]/10 text-[#8C6A1E] ring-1 ring-[#C9972B]/30'
                    : 'text-gray-500'
                } ${pressed(3) && isTarget ? 'scale-95' : ''}`}
              >
                {t}
              </button>
            )
          })}
        </div>
        <button
          ref={filter}
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-gray-600 transition ${
            active(2) ? 'border-[#C9972B]/50 ring-2 ring-[#C9972B]/20' : 'border-gray-200'
          } ${pressed(2) ? 'scale-95' : ''}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5h18l-7 8v5l-4 2v-7z" />
          </svg>
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5 text-[10px] uppercase tracking-wide text-gray-400">
          <div className="flex-1">Matter</div>
          <div className="hidden w-24 sm:block">Reference</div>
          <div className="w-16">Assigned</div>
          <div className="w-20 text-right">Status</div>
        </div>
        {ROWS.map((r, ri) => {
          const isTarget = ri === ROW_TARGET
          return (
            <div
              key={r.name}
              ref={isTarget ? row : undefined}
              className={`flex items-center gap-3 border-b border-gray-50 px-4 py-3 text-sm transition last:border-0 ${
                isTarget && active(4) ? 'bg-[#C9972B]/[0.06]' : ''
              } ${pressed(4) && isTarget ? 'scale-[0.99]' : ''}`}
            >
              <div className="flex-1 truncate font-medium text-[#0D1B2A]">{r.name}</div>
              <div className="hidden w-24 text-xs text-gray-400 sm:block">{r.ref}</div>
              <div className="w-16">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ background: r.tone }}
                >
                  {r.who}
                </span>
              </div>
              <div className="w-20 text-right">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[r.status]}`}>
                  {r.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cursor */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-10"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        aria-hidden
      >
        {clicking && (
          <span className="absolute -left-2 -top-2 h-6 w-6 animate-ping rounded-full bg-[#C9972B]/40" />
        )}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="#111827"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        >
          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.14h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
        </svg>
      </div>
    </div>
  )
}
