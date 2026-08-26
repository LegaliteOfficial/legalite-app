import Link from 'next/link'
import type { ComponentType } from 'react'
import {
  IllusEncrypted,
  IllusPrivateAi,
  IllusNoTraining,
} from '@/components/marketing/security-illustrations'

const SECURITY_CARDS: {
  title: string
  body: string
  Illustration: ComponentType
}[] = [
  {
    title: 'Isolated and encrypted',
    body: 'Every firm’s data is walled off at the database level and encrypted in transit and at rest. Access is scoped by role, so each person sees only what their position allows.',
    Illustration: IllusEncrypted,
  },
  {
    title: 'Private from the AI',
    body: 'The assistant only ever works with what you explicitly ask it. Your wider case files and client records are never fed to the model behind the scenes or pooled across firms.',
    Illustration: IllusPrivateAi,
  },
  {
    title: 'Never used to train our models',
    body: 'We do not use your documents, cases, or client data to train or improve our models without your explicit consent. Your work stays your work.',
    Illustration: IllusNoTraining,
  },
]

export function SecuritySection() {
  return (
    <section className="px-6 lg:px-12 py-32">
      <div className="mx-auto max-w-[1600px]">
        <div className="text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase">Security</div>
        <div className="h-px bg-white/10 mt-3 mb-6" />

        <div className="mt-12 grid gap-10 lg:grid-cols-2 items-start">
          <h2 className="text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]">
            Built with the integrity the law demands
          </h2>
          <div>
            <p className="text-white/60 text-base leading-relaxed max-w-md">
              Your clients trust you with their most sensitive matters, and we hold to
              the same standard. Your data stays isolated, encrypted, and never feeds our
              models without your consent.
            </p>
            <div className="mt-6">
              <Link
                href="/security-page"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white transition hover:border-[#C9972B]/30 hover:bg-white/5"
              >
                Learn more
                <span aria-hidden>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] md:grid-cols-3">
          {SECURITY_CARDS.map((card) => (
            <div key={card.title} className="flex flex-col bg-[#0A0E14]">
              <div
                className="flex h-[160px] items-center justify-center border-b border-white/5 px-6"
                style={{
                  background:
                    'radial-gradient(120% 100% at 50% 0%, rgba(201,151,43,0.10), transparent 60%)',
                }}
              >
                <card.Illustration />
              </div>
              <div className="p-8">
                <h4 className="text-xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold">
                  {card.title}
                </h4>
                <p className="mt-3 text-sm text-white/50 leading-relaxed">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
