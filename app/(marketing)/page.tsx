import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  FolderOpen,
  Gavel,
  Receipt,
  Timer,
} from '@phosphor-icons/react/dist/ssr'
import { TextScramble } from '@/components/marketing/text-scramble'
import { SecuritySection } from '@/components/marketing/security-section'
import { ResearchSlip } from '@/components/marketing/research-slip'
import { Reveal } from '@/components/marketing/reveal'
import { HeroProductDemo } from '@/components/marketing/hero-product-demo'
import { PersonaTabs } from '@/components/marketing/persona-tabs'
import { FAQAccordion } from '@/components/marketing/faq-accordion'
import { PhotoCaption, SectionMark } from '@/components/marketing/section-mark'
import { mk, serif } from '@/lib/marketing-theme'

const PRODUCTS = [
  {
    n: '01',
    image: '/marketing/photos/lawyer-at-laptop.jpg',
    alt: 'A lawyer working on a laptop in a bright office',
    label: 'Case management',
    title: 'Know where every matter stands.',
    href: '/product/case-management',
  },
  {
    n: '02',
    image: '/marketing/photos/law-library.jpg',
    alt: 'Shelves of bound law reports in a law library',
    label: 'Legal intelligence',
    title: 'Answers from Ghanaian law in seconds.',
    href: '/product/legal-research',
  },
  {
    n: '03',
    image: '/marketing/legal-research/laptop.png',
    alt: 'A laptop showing firm performance on a wooden desk',
    label: 'Practice management',
    title: 'Capture every billable minute.',
    href: '#pricing',
  },
]

const WORKFLOW_STEPS = [
  {
    Icon: Timer,
    title: 'Start the clock',
    body: 'A timer runs against the client at their agreed rate, and checks in every 30 minutes.',
  },
  {
    Icon: FolderOpen,
    title: 'Draft and file',
    body: 'Documents save to the case they belong to. Dates land on the firm calendar.',
  },
  {
    Icon: Receipt,
    title: 'Invoice the hours',
    body: 'Unbilled time turns into invoice lines in one step. Nothing retyped.',
  },
]

const PRACTICE_FEATURES = [
  { Icon: Receipt, title: 'Get paid for the work you did', body: 'One click invoices and payment tracking.' },
  { Icon: CalendarCheck, title: 'Never miss a court date', body: 'Every hearing and filing on one calendar.' },
  { Icon: FolderOpen, title: 'Find any case file in seconds', body: 'Every document stored against its case.' },
]

const PRICING_TIERS = [
  {
    name: 'Solo practitioner',
    price: 'Free to start',
    body: 'A free tier for individual lawyers. No team seats to pay for.',
    points: ['Clients, cases, and a dashboard', 'Daily AI research queries', 'Document templates'],
    cta: 'Ask about the free tier',
  },
  {
    name: 'Growing practice',
    price: 'Flat monthly plan',
    body: 'One predictable price, with a discount for annual billing.',
    points: ['Unlimited clients and cases', 'Deadline engine and document library', 'Billing and time tracking'],
    cta: 'See it in action',
    featured: true,
  },
  {
    name: 'Firm',
    price: 'Custom to firm size',
    body: 'Priced on the people who use it. Quoted after a walkthrough.',
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

export default function MarketingHome() {
  return (
    <>
      {/* HERO: headline over a photo mosaic with a live docket tile */}
      <section className="px-6 lg:px-12 pt-12 pb-20 lg:pt-16 lg:pb-24">
        <div className={mk.container}>
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <Reveal from="up">
              <SectionMark>For Ghanaian law firms</SectionMark>
              <h1 className={`mt-6 ${mk.h1}`}>
                Run your entire practice from one{' '}
                <span className="italic text-[#B8861F]">intelligent</span> platform.
              </h1>
            </Reveal>
            <Reveal from="up" delay={120}>
              <p className={mk.lead}>
                Cases, documents, billing, and research, connected. Spend your hours on the
                law, not the logistics.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/contact-us" className={mk.primaryCta}>
                  See it in action
                  <ArrowRight size={16} weight="bold" />
                </Link>
                <Link href="#pricing" className={mk.outlineCta}>
                  View pricing
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal from="up" delay={200}>
            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-16 lg:h-[540px] lg:grid-cols-12 lg:grid-rows-2">
              <div className={`${mk.photo} col-span-2 aspect-[16/10] lg:col-span-6 lg:row-span-2 lg:aspect-auto`}>
                <Image
                  src="/marketing/photos/team-meeting.jpg"
                  alt="Lawyers meeting around a table in a bright office"
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>

              <div className={`${mk.photo} aspect-[3/4] lg:col-span-3 lg:row-span-2 lg:aspect-auto`}>
                <Image
                  src="/marketing/photos/lawyer-at-desk.jpg"
                  alt="A lawyer at his desk"
                  fill
                  priority
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover object-top"
                />
              </div>

              {/* Docket tile: what the product shows a lawyer each morning */}
              <div className="flex aspect-[3/4] flex-col justify-between rounded-2xl bg-[#0D1B2A] p-5 text-white sm:p-6 lg:col-span-3 lg:aspect-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[2px] text-[#F2C65A]">
                    Today&rsquo;s docket
                  </span>
                  <Gavel size={20} weight="fill" className="text-[#F2C65A]" />
                </div>
                <div>
                  <div className={`text-xl leading-tight sm:text-2xl ${serif} font-semibold`}>
                    Republic v. Osei
                  </div>
                  <div className="mt-1 text-sm text-white/65">Hearing, 9:00 &middot; High Court, Accra</div>
                </div>
                <div className="space-y-2 border-t border-white/10 pt-4 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-white/65">Filing due</span>
                    <span className="font-medium">Ansah Trust</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-white/65">Timer</span>
                    <span className="font-mono font-medium tabular-nums text-[#F2C65A]">01:24:36</span>
                  </div>
                </div>
              </div>

              <div className={`${mk.photo} col-span-2 aspect-[16/9] lg:col-span-3 lg:aspect-auto`}>
                <Image
                  src="/marketing/photos/independence-arch.jpg"
                  alt="Independence Arch in Accra, inscribed Freedom and Justice"
                  fill
                  sizes="(min-width: 1024px) 25vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRODUCT DEMO: the cream warms through gold into navy at dusk, then
          fades back to cream behind the lower half of the demo so the
          product itself bridges the two colours. */}
      <section
        id="product"
        className="relative scroll-mt-20 px-6 lg:px-12 pt-[320px] pb-8"
        style={{
          background:
            'linear-gradient(180deg, #F8F4EE 0px, #F5E9CC 50px, #EBCF8E 100px, #C99A48 150px, #6E5634 200px, #2B2D33 245px, #14202E 280px, #0D1B2A 310px, #0D1B2A 58%, #1A2638 66%, #4A4C52 74%, #9A9284 82%, #D8CCB6 91%, #F8F4EE 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-[180px] h-[520px]"
          aria-hidden
          style={{
            background: 'radial-gradient(45% 40% at 50% 45%, rgba(242,198,90,0.18), transparent 100%)',
          }}
        />
        <div className={`${mk.container} relative`}>
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex justify-center">
              <SectionMark light>The workspace</SectionMark>
            </div>
            <h2 className={`mt-5 text-3xl sm:text-4xl lg:text-5xl text-white ${serif} font-semibold tracking-tight leading-[1.08]`}>
              The whole firm, on one screen.
            </h2>
            <p className="mt-4 text-lg text-white/65">Click through matters, billing, and research.</p>
          </div>
          <Reveal from="up" delay={120}>
            <div className="mx-auto mt-12 max-w-[1200px]">
              <HeroProductDemo />
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className={mk.section}>
        <div className={mk.container}>
          <SectionMark>One platform</SectionMark>
          <h2 className={`mt-5 max-w-3xl ${mk.h2}`}>Every part of your practice, connected.</h2>

          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
            {PRODUCTS.map((p, i) => (
              <Reveal key={p.n} from="up" delay={i * 120}>
                <Link href={p.href} className="group block">
                  <div className={`${mk.photo} aspect-[4/3]`}>
                    <Image
                      src={p.image}
                      alt={p.alt}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="mt-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[2px] text-[#A67A1C]">
                    <span className={`${serif} text-sm normal-case tracking-normal`}>&sect;&nbsp;{p.n}</span>
                    {p.label}
                  </div>
                  <h3 className={`mt-2 ${mk.h3}`}>{p.title}</h3>
                  <span className={`mt-3 ${mk.textLink}`}>
                    Learn more <ArrowRight size={14} weight="bold" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GHANAIAN LEGAL AI: full-bleed Accra photo */}
      <section className="relative overflow-hidden px-6 lg:px-12 py-20 lg:py-28">
        <Image
          src="/marketing/photos/accra-aerial.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B2A]/95 via-[#0D1B2A]/80 to-[#0D1B2A]/40" aria-hidden />
        <div className={`${mk.container} relative grid gap-12 lg:grid-cols-2 lg:items-center`}>
          <div className="text-white">
            <SectionMark light>Ghanaian legal AI</SectionMark>
            <h2 className={`mt-5 text-4xl sm:text-5xl lg:text-6xl ${serif} font-semibold tracking-tight leading-[1.02]`}>
              Grounded in Ghanaian law.{' '}
              <span className="text-[#F2C65A]">
                <TextScramble text="Sharpened" />
              </span>{' '}
              to your case.
            </h2>
            <p className="mt-6 max-w-md text-lg text-white/75 leading-relaxed">
              Statutes, case law, and precedent from your jurisdiction, with every source
              cited.
            </p>
            <Link href="/product/legal-research" className={`mt-8 ${mk.primaryCta}`}>
              Explore legal intelligence
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
          <Reveal from="right">
            <ResearchSlip />
          </Reveal>
        </div>
      </section>

      {/* HOW IT CONNECTS */}
      <section className={`${mk.section} bg-white`}>
        <div className={`${mk.container} grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-20`}>
          <div>
            <div className={`${mk.photo} ${mk.shadow} aspect-[4/3]`}>
              <Image
                src="/marketing/photos/lawyer-on-sofa.jpg"
                alt="A lawyer working on a laptop"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-[center_30%]"
              />
            </div>
            <PhotoCaption label="One afternoon">A timer, a draft, and an invoice, all on the same matter.</PhotoCaption>
          </div>
          <div>
            <SectionMark>How it connects</SectionMark>
            <h2 className={`mt-5 ${mk.h2}`}>Do the work once. Every record updates itself.</h2>
            <ol className="mt-10 space-y-4">
              {WORKFLOW_STEPS.map(({ Icon, title, body }, i) => (
                <li key={title} className={`${mk.card} flex gap-4 p-5`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0D1B2A] text-[#F2C65A]">
                    <Icon size={20} weight="fill" />
                  </span>
                  <div>
                    <h3 className="font-semibold">
                      <span className={`mr-2 ${serif} text-[#A67A1C]`}>{i + 1}.</span>
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-[#0D1B2A]/60 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section className={mk.section}>
        <div className={mk.container}>
          <SectionMark>Built for your role</SectionMark>
          <h2 className={`mt-5 mb-10 max-w-3xl ${mk.h2}`}>Whoever you are in the firm, it fits.</h2>
          <PersonaTabs />
        </div>
      </section>

      {/* PRACTICE MANAGEMENT */}
      <section className={`${mk.section} bg-white`}>
        <div className={`${mk.container} grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center`}>
          <div>
            <SectionMark>Practice management</SectionMark>
            <h2 className={`mt-5 ${mk.h2}`}>Run the whole firm, not just the admin.</h2>
            <ul className="mt-10 space-y-5">
              {PRACTICE_FEATURES.map(({ Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C9972B]/15 text-[#A67A1C]">
                    <Icon size={22} weight="duotone" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-0.5 text-sm text-[#0D1B2A]/60">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Reveal from="right">
            <div className={`overflow-hidden rounded-2xl border border-[#0D1B2A]/[0.08] bg-white ${mk.shadow}`}>
              <Image
                src="/marketing/clients.svg"
                alt="LegaLite clients list page"
                width={1200}
                height={800}
                className="h-auto w-full"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <SecuritySection />

      {/* PRICING */}
      <section id="pricing" className={`${mk.section} scroll-mt-20`}>
        <div className={mk.container}>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div>
              <SectionMark>Pricing</SectionMark>
              <h2 className={`mt-5 ${mk.h2}`}>Priced for the size of your firm.</h2>
            </div>
            <p className={`${mk.lead} lg:max-w-md lg:justify-self-end`}>
              Plans scale with the people who use LegaLite. Solo practitioners can start for
              free.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col rounded-2xl p-7 ${tier.featured ? `bg-[#0D1B2A] text-white ${mk.shadow}` : mk.card
                  }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-semibold ${tier.featured ? 'text-[#F2C65A]' : 'text-[#A67A1C]'}`}>
                    {tier.name}
                  </span>
                  {tier.featured && (
                    <span className="rounded-md bg-[#F2C65A] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0D1B2A]">
                      Most popular
                    </span>
                  )}
                </div>
                <div className={`mt-3 text-3xl ${serif} font-semibold`}>{tier.price}</div>
                <p className={`mt-3 text-sm ${tier.featured ? 'text-white/70' : 'text-[#0D1B2A]/60'}`}>{tier.body}</p>
                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {tier.points.map((point) => (
                    <li key={point} className={`flex gap-2.5 text-sm ${tier.featured ? 'text-white/85' : 'text-[#0D1B2A]/75'}`}>
                      <CheckCircle size={18} weight="fill" className="shrink-0 text-[#C9972B]" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link href="/contact-us" className={`mt-8 w-full ${tier.featured ? mk.primaryCta : mk.darkCta}`}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${mk.section} scroll-mt-20 bg-white`}>
        <div className={`${mk.container} grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start`}>
          <div>
            <SectionMark>Questions</SectionMark>
            <h2 className={`mt-5 ${mk.h2}`}>Before you book a walkthrough</h2>
            <p className={`mt-5 max-w-md ${mk.lead}`}>
              Something else on your mind? Write to us. No demo booking needed.
            </p>
            <Link href="mailto:contact@legalite.app" className={`mt-7 ${mk.outlineCta}`}>
              contact@legalite.app
            </Link>
          </div>
          <FAQAccordion items={HOME_FAQ} />
        </div>
      </section>
    </>
  )
}
