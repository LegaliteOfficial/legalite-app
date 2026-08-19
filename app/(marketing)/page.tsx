import Image from 'next/image'
import Link from 'next/link'
import { TextScramble } from '@/components/marketing/text-scramble'
import { FeatureTabs } from '@/components/marketing/feature-tabs'
import { SecuritySection } from '@/components/marketing/security-section'
import { AiSearchTyping } from '@/components/marketing/ai-typing'

const sectionClass = 'px-6 lg:px-12 py-32'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase'
const dividerClass = 'h-px bg-white/10 mt-3 mb-6'
const heading2Class =
  "text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]"
const paragraphClass = 'text-white/50 text-base leading-relaxed'

const FEATURE_CARDS = [
  {
    image: '/marketing/invoices-table.svg',
    alt: 'Invoices table',
    title: 'Case management',
    body: 'Create cases, assign work, track progress, and generate reports in one click. Your team always knows where every matter stands.',
    href: '/product/case-management',
  },
  {
    image: '/marketing/ai-search.svg',
    alt: "UI of LegaLite's AI prompt search",
    title: 'Legal intelligence',
    body: 'Plain English document queries. Instant judgment summaries. Side by side precedent comparison. Built on AI trained for Ghanaian law.',
    href: '/product/legal-research',
  },
  {
    image: null,
    visual: 'practice',
    alt: 'Firm performance snapshot',
    title: 'Practice management',
    body: 'Track billable hours, generate invoices, and see firm wide performance at a glance. Real time reports on finances, clients, cases, and team, without the spreadsheets.',
    href: null,
  },
]

const PRACTICE_FEATURES = [
  {
    title: 'Client and billing management',
    body: 'Generate invoices in one click, track payment status, and see who owes what at a glance, without ever opening a spreadsheet.',
  },
  {
    title: 'Calendar',
    body: 'Court dates, filing deadlines, and hearings in one shared calendar. The deadline engine tracks every date so nothing slips through.',
  },
  {
    title: 'Documents',
    body: 'Draft, store, and organize every matter’s documents in one place. Secure storage and fast retrieval, always tied to the case they belong to.',
  },
]

const PERF_BARS = [34, 48, 40, 58, 46, 64, 52, 74, 60, 86]
const PERF_STATS = [
  { label: 'Billable hrs', value: '182' },
  { label: 'Invoices', value: '24' },
  { label: 'Collected', value: 'GHS 96k' },
]

function PracticePreview() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-medium">Firm performance</span>
        <span className="text-[11px] text-white/40">This month</span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {PERF_STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
          >
            <div className="text-[9px] uppercase tracking-wide text-white/40">{s.label}</div>
            <div className="mt-1 text-white text-sm font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex h-16 items-end gap-1.5" aria-hidden>
        {PERF_BARS.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-[3px]"
            style={{
              height: `${h}%`,
              background:
                i === PERF_BARS.length - 1
                  ? 'linear-gradient(180deg,#E8B84B,#C9972B)'
                  : 'linear-gradient(180deg,rgba(201,151,43,0.55),rgba(201,151,43,0.10))',
            }}
          />
        ))}
      </div>
    </div>
  )
}

const POSITIONING_PILLARS = [
  {
    title: 'One connected system',
    body: 'Case management, billing, documents, scheduling, and client communication work together, not as a stack of disconnected tools.',
  },
  {
    title: 'Grounded in Ghanaian law',
    body: 'Legal research and AI trained on Ghanaian statutes, case law, and judicial precedent, so answers apply to your jurisdiction.',
  },
  {
    title: 'Secure by design',
    body: 'Every firm gets isolated data, encrypted storage, and role based access across the team, enforced at the database.',
  },
]

export default function MarketingHome() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(120% 80% at 50% -20%, rgba(201,151,43,0.13), transparent 55%), radial-gradient(90% 70% at 82% 8%, rgba(20,38,60,0.45), transparent 60%), #070A0F',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9972B]/40 to-transparent"
          aria-hidden
        />

        <div className="px-6 lg:px-12 pt-24 pb-28">
          <div className={containerClass}>
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-6xl lg:text-7xl [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-[-1.5px] leading-[1.02] text-white">
                The intelligent platform that runs your entire legal practice.
              </h1>

              <p className="mt-8 text-white/55 text-lg leading-relaxed max-w-2xl">
                Cases, documents, billing, scheduling, and client communication in one
                connected system. Spend your hours on the law, not the logistics.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/contact-us"
                  className="inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white bg-gradient-to-b from-[#C9972B] to-[#8C6A1E] hover:opacity-90 transition shadow-[0_1px_0_rgba(255,255,255,0.2)_inset]"
                >
                  Join waitlist
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white/90 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 transition"
                >
                  Sign in
                </Link>
              </div>

              <p className="mt-6 text-white/35 text-sm">
                Grounded in Ghanaian law. Secured with bank grade encryption.
              </p>
            </div>

            <div className="mt-24 relative mx-auto w-full max-w-[1200px]">
              <div
                className="absolute -inset-x-16 -top-16 bottom-0 -z-10"
                aria-hidden
                style={{
                  background:
                    'radial-gradient(55% 55% at 50% 0%, rgba(201,151,43,0.16), transparent 70%)',
                }}
              />
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                <Image
                  src="/marketing/legalite-app-ui.png"
                  alt="LegaLite dashboard preview"
                  width={1728}
                  height={972}
                  sizes="(max-width: 1200px) 92vw, 1200px"
                  priority
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESIGN TO SCALE */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Design to scale</div>
          <div className={dividerClass} />

          <div className="mt-10 grid gap-10 lg:grid-cols-2 items-end">
            <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-md">
              Most legal software handles one thing well. LegaLite brings case
              management, AI research, billing, and client communication into one place,
              so your firm runs as a single connected system instead of a stack of
              disconnected tools.
            </p>
            <h3 className={`${heading2Class} text-right`}>
              One platform. Every part of your practice.
            </h3>
          </div>

          <div className="mt-24 grid gap-6 md:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="group flex flex-col rounded-2xl border border-white/10 bg-[#0A0E14] overflow-hidden transition hover:border-[#C9972B]/30"
              >
                <div
                  className="relative aspect-[4/3] flex items-center justify-center p-8 border-b border-white/5"
                  style={{
                    background:
                      'radial-gradient(120% 100% at 50% 0%, rgba(201,151,43,0.10), transparent 60%)',
                  }}
                >
                  {card.visual === 'practice' ? (
                    <PracticePreview />
                  ) : (
                    card.image && (
                      <Image
                        src={card.image}
                        alt={card.alt}
                        width={400}
                        height={300}
                        className="max-h-full w-full max-w-sm object-contain"
                      />
                    )
                  )}
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <h5 className="text-white text-lg [font-family:Inter,Arial,sans-serif] font-medium">
                    {card.title}
                  </h5>
                  <p className="mt-3 flex-1 text-sm text-white/50 leading-relaxed">
                    {card.body}
                  </p>

                  {card.href && (
                    <div className="mt-8">
                      <Link
                        href={card.href}
                        className="inline-flex items-center gap-2 text-sm text-[#E8B84B] transition group-hover:gap-3"
                      >
                        Learn more
                        <span aria-hidden>&rarr;</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POSITIONING */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Why LegaLite</div>
          <div className={dividerClass} />

          <div className="max-w-5xl mt-10">
            <h3 className={heading2Class}>
              Cases tracked. Documents organized. Billing automated. Research surfaced
              in seconds. LegaLite carries the operational weight of running a practice,
              so your team stays focused on strategy, not spreadsheets.
            </h3>
          </div>

          <div className="mt-24 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] md:grid-cols-3">
            {POSITIONING_PILLARS.map((pillar, i) => (
              <div key={pillar.title} className="bg-[#0A0E14] p-8 lg:p-10">
                <div className="[font-family:Literata,'Times_New_Roman',serif] text-2xl text-[#C9972B]">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h5 className="mt-6 text-white text-lg [font-family:Inter,Arial,sans-serif] font-medium">
                  {pillar.title}
                </h5>
                <p className="mt-3 text-sm text-white/50 leading-relaxed">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI-POWERED LEGAL RESEARCH */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Ghanaian legal AI</div>
          <div className={dividerClass} />

          <div className="mt-10 grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h3 className="text-3xl md:text-6xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1]">
                Grounded in Ghanaian law.
                <br />
                <TextScramble text="Sharpened" /> to your case.
              </h3>
              <div className="mt-8 space-y-4">
                <p className="text-white/60 text-base leading-relaxed max-w-md">
                  Ask questions in plain English, summarize a judgment in seconds, and
                  compare precedents side by side. Every answer draws on the statutes,
                  case law, and judicial precedent that apply to your jurisdiction.
                </p>
                <p className="text-white/40 text-sm leading-relaxed max-w-md">
                  Purpose built for Ghana, not a generic model adapted to fit.
                </p>
              </div>
            </div>

            <div className="flex items-center rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-12">
              <AiSearchTyping />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE TABS (hidden in source) */}
      <section className="hidden">
        <div className={sectionClass}>
          <div className={containerClass}>
            <FeatureTabs />
          </div>
        </div>
      </section>

      {/* PRACTICE MANAGEMENT */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Practice management</div>
          <div className={dividerClass} />

          <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_1.4fr] items-start">
            <div>
              <h3 className={heading2Class}>Run the whole firm, not just the admin.</h3>
              <p className={`${paragraphClass} mt-6 max-w-md`}>
                Invoices generated. Deadlines tracked. Documents in order. LegaLite runs
                the business side of your firm so you can focus on the practice.
              </p>

              <div className="mt-12">
                {PRACTICE_FEATURES.map((feature, i) => (
                  <div key={feature.title}>
                    <div className="h-px bg-white/10" />
                    <div className="py-6">
                      <div className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C9972B]" />
                        <h6 className="text-white text-base [font-family:Inter,Arial,sans-serif] font-medium">
                          {feature.title}
                        </h6>
                      </div>
                      <p className="mt-2 pl-[18px] text-sm text-white/50 leading-relaxed">
                        {feature.body}
                      </p>
                    </div>
                    {i === PRACTICE_FEATURES.length - 1 && <div className="h-px bg-white/10" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-10 -z-10"
                aria-hidden
                style={{
                  background:
                    'radial-gradient(50% 50% at 60% 25%, rgba(201,151,43,0.12), transparent 70%)',
                }}
              />
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                <Image
                  src="/marketing/clients.svg"
                  alt="LegaLite clients list page"
                  width={1200}
                  height={800}
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SecuritySection />
    </>
  )
}
