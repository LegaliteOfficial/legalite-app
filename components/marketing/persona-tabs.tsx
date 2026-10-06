'use client'

import Image from 'next/image'
import { useState } from 'react'

const PERSONAS = [
  {
    id: 'solo',
    image: '/marketing/photos/solo-practitioner.jpg',
    alt: 'A lawyer working alone at her desk with a laptop and phone',
    label: 'Solo practitioners',
    title: 'Your own back office, without hiring one.',
    points: [
      'A running timer on each client, so no call or draft goes unbilled',
      'Every filing and hearing date tracked by the deadline engine',
      'Research answers grounded in Ghanaian law, without a library subscription',
    ],
  },
  {
    id: 'associates',
    image: '/marketing/photos/lawyer-reviewing-file.jpg',
    alt: 'A lawyer reviewing a case file beside his laptop',
    label: 'Associates and staff',
    title: 'Less chasing. More practice.',
    points: [
      'Assigned tasks and matters in one queue',
      'Drafts saved against the case they belong to',
      'A shared calendar for court dates across the team',
    ],
  },
  {
    id: 'partners',
    image: '/marketing/photos/partner-meeting.jpg',
    alt: 'A senior partner in a meeting at his desk',
    label: 'Managing partners',
    title: 'See the whole firm from one screen.',
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
        className="flex w-full flex-wrap gap-1 rounded-xl border border-[#0D1B2A]/10 bg-white p-1.5 sm:w-fit sm:rounded-xl"
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
            className={`flex-1 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
              i === active
                ? 'bg-[#0D1B2A] text-white shadow-md'
                : 'text-[#0D1B2A]/60 hover:text-[#0D1B2A]'
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
        className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#E9E1D3] shadow-[0_30px_60px_-34px_rgba(13,27,42,0.45)]">
          <Image
            src={persona.image}
            alt={persona.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <h3 className="text-2xl md:text-4xl text-[#0D1B2A] [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.1]">
            {persona.title}
          </h3>
          <ul className="mt-7 flex flex-col gap-3">
            {persona.points.map((point) => (
              <li key={point} className="flex gap-3 rounded-xl border border-[#0D1B2A]/[0.08] bg-white px-5 py-4">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C9972B]" aria-hidden />
                <span className="text-[15px] font-medium leading-relaxed text-[#0D1B2A]/80">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
