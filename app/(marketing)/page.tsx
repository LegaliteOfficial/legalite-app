import Image from 'next/image'
import Link from 'next/link'
import { TextScramble } from '@/components/marketing/text-scramble'
import { FeatureTabs } from '@/components/marketing/feature-tabs'
import { SecuritySection } from '@/components/marketing/security-section'
import { ResearchSlip } from '@/components/marketing/research-slip'
import { Reveal } from '@/components/marketing/reveal'
import { IllustrationSwap } from '@/components/marketing/illustration-swap'
import { HeroProductDemo } from '@/components/marketing/hero-product-demo'
import { PersonaTabs } from '@/components/marketing/persona-tabs'
import { FAQAccordion } from '@/components/marketing/faq-accordion'

const sectionClass = 'px-6 lg:px-12 py-32'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase'
const dividerClass = 'h-px bg-white/10 mt-3 mb-6'
const heading2Class =
  "text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]"
const paragraphClass = 'text-white/50 text-base leading-relaxed'

const FEATURE_CARDS = [
  {
    first: '/marketing/CASE1.svg',
    second: '/marketing/CASE2.svg',
    alt: 'Case management illustration',
    label: 'Case management',
    title: 'Know where every matter stands',
    body: 'Create cases, assign work, track progress, and generate reports in one click. Your team always knows where every matter stands.',
    href: '/product/case-management',
  },
  {
    first: '/marketing/AI1.svg',
    second: '/marketing/AI2.svg',
    alt: 'Legal intelligence illustration',
    label: 'Legal intelligence',
    title: 'Answers from Ghanaian law in seconds',
    body: 'Plain English document queries. Instant judgment summaries. Side by side precedent comparison. Built on AI trained for Ghanaian law.',
    href: '/product/legal-research',
  },
  {
    first: '/marketing/PERFORMANCE1.svg',
    second: '/marketing/PERFORMANCE2.svg',
    alt: 'Practice management illustration',
    label: 'Practice management',
    title: 'Capture every billable minute',
    body: 'Track billable hours, generate invoices, and see firm wide performance at a glance. Real time reports on finances, clients, cases, and team, without the spreadsheets.',
    href: null,
  },
]

const PRACTICE_FEATURES = [
  {
    label: 'Billing',
    title: 'Get paid for the work you did',
    body: 'Generate invoices in one click, track payment status, and see who owes what at a glance, without ever opening a spreadsheet.',
  },
  {
    label: 'Calendar',
    title: 'Never miss a court date',
    body: 'Court dates, filing deadlines, and hearings in one shared calendar. The deadline engine tracks every date so nothing slips through.',
  },
  {
    label: 'Documents',
    title: 'Find any case file in seconds',
    body: 'Draft, store, and organize every matter’s documents in one place. Secure storage and fast retrieval, always tied to the case they belong to.',
  },
]

const WORKFLOW_STEPS = [
  {
    title: 'Start the clock on the matter',
    body: 'Open a case and start a timer. It runs against that client at their agreed rate, and checks in every 30 minutes so a forgotten timer never inflates a bill.',
    result: 'Time logged to the client and case',
  },
  {
    title: 'Draft and file in the same place',
    body: 'Draft from a template or upload the file, and it is saved against the case it belongs to. Court dates and filing deadlines sit on the shared firm calendar.',
    result: 'Documents and dates linked to the case',
  },
  {
    title: 'Turn the hours into an invoice',
    body: 'Stopped time collects under Unbilled Time for each client. Convert it into invoice lines in one step, with nothing retyped from a timesheet.',
    result: 'Invoice raised from logged work',
  },
]

const TRUST_FACTS = [
  { value: 'AES-256', label: 'Encryption for stored data' },
  { value: 'TLS 1.2+', label: 'Encryption for data in transit' },
  { value: 'Per firm', label: 'Data isolation enforced in the database' },
  { value: 'Role based', label: 'Access scoped to each position' },
]

const PRICING_TIERS = [
  {
    name: 'Solo practitioner',
    price: 'Free to start',
    body: 'A free tier for individual lawyers, with room to move up when your caseload grows. No team seats to pay for.',
    points: ['Clients, cases, and a personal dashboard', 'Daily AI research queries', 'Document templates'],
    cta: 'Ask about the free tier',
  },
  {
    name: 'Growing practice',
    price: 'Flat monthly plan',
    body: 'One predictable monthly price for unlimited clients and cases, with annual billing available at a discount.',
    points: ['Unlimited clients and cases', 'Deadline engine and document library', 'Billing, invoicing, and time tracking'],
    cta: 'See it in action',
    featured: true,
  },
  {
    name: 'Firm',
    price: 'Custom to firm size',
    body: 'Priced on the number of people in your firm, so you only pay for the seats you use. Quoted after a walkthrough.',
    points: ['Firm overview for partners', 'Team roles and permissions', 'Dedicated onboarding support'],
    cta: 'Get a quote',
  },
]

const HOME_FAQ = [
  {
    question: 'Why is pricing not listed as a single number?',
    answer:
      'Firms in Ghana range from one lawyer to large chambers, so a single price would overcharge small practices. Solo lawyers can start on a free tier, and firm plans are quoted on the number of people who will use LegaLite.',
  },
  {
    question: 'Can I use LegaLite on my phone?',
    answer:
      'Yes. LegaLite runs in the browser on phones, tablets, and laptops, so you can check a matter, a deadline, or a running timer between court sessions without installing anything.',
  },
  {
    question: 'How long does it take to get set up?',
    answer:
      'The firm owner signs up once and invites the rest of the team from the dashboard. Clients and cases can be added straight away, and our team walks you through moving your existing records across during onboarding.',
  },
  {
    question: 'Is the AI a replacement for my own legal judgement?',
    answer:
      'No. The assistant answers questions against Ghanaian statutes, case law, and precedent and shows its sources, so you can verify every point before relying on it.',
  },
  {
    question: 'Who owns the data we put into LegaLite?',
    answer:
      'You do. Your firm data is isolated from every other firm, is never used to train our models without your consent, and can be exported in full whenever you ask.',
  },
]

const primaryCtaClass =
  'inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-semibold text-[#0D1B2A] bg-gradient-to-b from-[#E8B84B] to-[#C9972B] hover:brightness-105 transition shadow-[0_10px_30px_-10px_rgba(201,151,43,0.7),0_1px_0_rgba(255,255,255,0.35)_inset]'
const secondaryCtaClass =
  'inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-6 py-3.5 text-sm font-medium text-white transition hover:border-[#C9972B]/40 hover:bg-white/5'

export default function MarketingHome() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(120% 80% at 50% -20%, rgba(201,151,43,0.13), transparent 55%), radial-gradient(90% 70% at 82% 8%, rgba(20,38,60,0.45), transparent 60%), #1F2937',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9972B]/40 to-transparent"
          aria-hidden
        />

        <div className="px-6 lg:px-12 pt-16 md:pt-24 pb-28">
          <div className={containerClass}>
            <div className="mx-auto max-w-4xl text-center">
              <Reveal from="up">
                <div className={eyebrowClass}>Practice management for Ghanaian law firms</div>
                <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-[-1.5px] leading-[1.03] text-white">
                  The intelligent platform that runs your entire legal practice.
                </h1>
              </Reveal>
              <Reveal from="up" delay={120}>
                <p className="mx-auto mt-7 max-w-2xl text-white/60 text-base md:text-lg leading-relaxed">
                  Cases, documents, billing, scheduling, and research in one connected
                  system. Spend your hours on the law, not the logistics.
                </p>

                <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  <Link href="/contact-us" className={primaryCtaClass}>
                    See it in action
                  </Link>
                  <Link href="#pricing" className={secondaryCtaClass}>
                    View pricing
                  </Link>
                </div>

                <p className="mt-5 text-white/40 text-sm">
                  A free, no obligation walkthrough with our team.
                </p>
              </Reveal>
            </div>

            <Reveal from="up" delay={240}>
              <div id="product" className="relative mx-auto mt-16 md:mt-20 w-full max-w-[1200px] scroll-mt-28">
                <div
                  className="absolute -inset-x-16 -top-16 bottom-0 -z-10"
                  aria-hidden
                  style={{
                    background:
                      'radial-gradient(55% 55% at 50% 0%, rgba(201,151,43,0.18), transparent 70%)',
                  }}
                />
                <HeroProductDemo />
                <p className="mt-5 text-center text-white/35 text-xs">
                  The LegaLite workspace. Sample matters shown.
                </p>
              </div>
            </Reveal>
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
            <h2 className={`${heading2Class} lg:text-right`}>
              One platform. Every part of your practice.
            </h2>
          </div>

          <div className="mt-20 grid gap-x-8 gap-y-14 md:grid-cols-3">
            {FEATURE_CARDS.map((card, i) => (
              <Reveal key={card.title} from="up" delay={i * 120}>
                <div className="group flex h-full flex-col">
                  <IllustrationSwap
                    first={card.first}
                    second={card.second}
                    alt={card.alt}
                  />

                  <div className="mt-7 flex flex-1 flex-col">
                    <div className="flex items-baseline gap-3 text-xs uppercase tracking-[2px] text-white/40">
                      <span className="[font-family:Literata,'Times_New_Roman',serif] text-sm normal-case tracking-normal text-[#C9972B]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {card.label}
                    </div>
                    <h3 className="mt-3 text-white text-xl [font-family:Literata,'Times_New_Roman',serif] font-semibold">
                      {card.title}
                    </h3>

                    <p className="mt-3 flex-1 text-sm text-white/50 leading-relaxed">
                      {card.body}
                    </p>

                    {card.href && (
                      <div className="mt-6">
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CONNECTED WORKFLOW */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>How it connects</div>
          <div className={dividerClass} />

          <div className="max-w-4xl mt-10">
            <h2 className={heading2Class}>
              Do the work once. Every record updates itself.
            </h2>
            <p className={`${paragraphClass} mt-6 max-w-2xl`}>
              The case, the time, the documents, and the invoice are one record in
              LegaLite, not four tools you copy between. Here is a single afternoon on a
              matter.
            </p>
          </div>

          <ol className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] md:grid-cols-3">
            {WORKFLOW_STEPS.map((step, i) => (
              <li key={step.title} className="relative flex flex-col bg-[#2A3544] p-8 lg:p-10">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9972B]/40 [font-family:Literata,'Times_New_Roman',serif] text-sm text-[#E8B84B]">
                    {i + 1}
                  </span>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <span className="hidden h-px flex-1 bg-gradient-to-r from-[#C9972B]/40 to-transparent md:block" aria-hidden />
                  )}
                </div>
                <h3 className="mt-6 text-white text-lg [font-family:Inter,Arial,sans-serif] font-medium">
                  {step.title}
                </h3>
                <p className="mt-3 flex-1 text-sm text-white/50 leading-relaxed">{step.body}</p>
                <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#C9972B]/10 px-3 py-1.5 text-xs text-[#E8B84B]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9972B]" aria-hidden />
                  {step.result}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* AI-POWERED LEGAL RESEARCH */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Ghanaian legal AI</div>
          <div className={dividerClass} />

          <div className="mt-10 grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl md:text-6xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1]">
                Grounded in Ghanaian law.
                <br />
                <TextScramble text="Sharpened" /> to your case.
              </h2>
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

            <div className="flex items-center rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:p-12">
              <ResearchSlip />
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

      {/* PERSONAS */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Built for your role</div>
          <div className={dividerClass} />

          <div className="mt-10 mb-12 max-w-3xl">
            <h2 className={heading2Class}>Whoever you are in the firm, it fits.</h2>
          </div>

          <PersonaTabs />
        </div>
      </section>

      {/* PRACTICE MANAGEMENT */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Practice management</div>
          <div className={dividerClass} />

          <div className="mt-12 grid gap-16 lg:grid-cols-[1fr_1.4fr] items-start">
            <div>
              <h2 className={heading2Class}>Run the whole firm, not just the admin.</h2>
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
                        <h3 className="text-white text-base [font-family:Inter,Arial,sans-serif] font-medium">
                          {feature.title}
                        </h3>
                        <span className="text-[0.65rem] uppercase tracking-[2px] text-white/35">
                          {feature.label}
                        </span>
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

      <SecuritySection facts={TRUST_FACTS} />

      {/* PRICING */}
      <section id="pricing" className={`${sectionClass} scroll-mt-20`}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Pricing</div>
          <div className={dividerClass} />

          <div className="mt-10 grid gap-10 lg:grid-cols-2 items-end">
            <h2 className={heading2Class}>Priced for the size of your firm.</h2>
            <p className="text-white/60 text-base leading-relaxed max-w-md">
              A one lawyer practice should not pay what a thirty lawyer firm pays. Plans
              scale with the people who use LegaLite, and solo practitioners can start
              for free.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col rounded-2xl border p-8 ${
                  tier.featured
                    ? 'border-[#C9972B]/50 bg-[#C9972B]/[0.06]'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <div className="text-sm text-white/60">{tier.name}</div>
                <div className="mt-3 text-2xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold">
                  {tier.price}
                </div>
                <p className="mt-4 text-sm text-white/50 leading-relaxed">{tier.body}</p>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {tier.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm text-white/70">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9972B]" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact-us"
                  className={`mt-8 ${tier.featured ? primaryCtaClass : secondaryCtaClass}`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + CONTACT */}
      <section id="faq" className={`${sectionClass} scroll-mt-20`}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Questions</div>
          <div className={dividerClass} />

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.4fr] items-start">
            <div>
              <h2 className={heading2Class}>Before you book a walkthrough</h2>
              <p className="mt-6 text-base text-white/60 leading-relaxed max-w-md">
                Have a question that is not answered here? Write to us and a member of the
                team will reply directly. No demo booking needed.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="mailto:contact@legalite.app" className={secondaryCtaClass}>
                  contact@legalite.app
                </Link>
              </div>
            </div>
            <FAQAccordion items={HOME_FAQ} />
          </div>
        </div>
      </section>
    </>
  )
}
