'use client'

import { useState } from 'react'

const PERSONAS = [
  {
    id: 'solo',
    label: 'Solo practitioners',
    title: 'Your own back office, without hiring one.',
    body: 'You are the lawyer, the clerk, and the accounts department. LegaLite handles the parts that do not need a law degree, so the hours you work are the hours you bill.',
    points: [
      'A running timer on each client, so no call or draft goes unbilled',
      'Every filing and hearing date tracked by the deadline engine',
      'Research answers grounded in Ghanaian law, without a library subscription',
    ],
  },
  {
    id: 'associates',
    label: 'Associates and staff',
    title: 'Less chasing. More practice.',
    body: 'Everything about a matter sits in one place: the documents, the dates, the notes, and who is doing what. Nobody has to ask where the latest draft is.',
    points: [
      'Assigned tasks and matters in one queue',
      'Drafts saved against the case they belong to',
      'A shared calendar for court dates across the team',
    ],
  },
  {
    id: 'partners',
    label: 'Managing partners',
    title: 'See the whole firm from one screen.',
    body: 'The firm overview shows caseload, billing, and team activity in real time, so you can spot a stalled matter or an overdue invoice before a client does.',
    points: [
      'Firm wide view of matters, deadlines, and unbilled time',
      'Role based access so each person sees only what their position allows',
      'Invite and manage the whole team from the dashboard',
    ],
  },
] as const

export function PersonaTabs() {
  const [active, setActive] = useState(0)
  const persona = PERSONAS[active]

  return (
    <div>
      <div
        role="tablist"
        aria-label="Who LegaLite is for"
        className="flex w-full flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 sm:w-fit sm:rounded-full"
      >
        {PERSONAS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`persona-tab-${p.id}`}
            aria-selected={i === active}
            aria-controls={`persona-panel-${p.id}`}
            onClick={() => setActive(i)}
            className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm transition sm:flex-none ${
              i === active
                ? 'bg-[#C9972B] text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        key={persona.id}
        role="tabpanel"
        id={`persona-panel-${persona.id}`}
        aria-labelledby={`persona-tab-${persona.id}`}
        className="mt-12 grid gap-10 lg:grid-cols-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
      >
        <div>
          <h3 className="text-2xl md:text-4xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.1]">
            {persona.title}
          </h3>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/55">{persona.body}</p>
        </div>
        <ul className="flex flex-col">
          {persona.points.map((point) => (
            <li key={point} className="flex gap-3 border-t border-white/10 py-5 last:border-b">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9972B]" aria-hidden />
              <span className="text-sm leading-relaxed text-white/70">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
