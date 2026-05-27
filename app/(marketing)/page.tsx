import Image from 'next/image'
import Link from 'next/link'
import { TextScramble } from '@/components/marketing/text-scramble'
import { FeatureTabs } from '@/components/marketing/feature-tabs'
import { SecuritySection } from '@/components/marketing/security-section'

const sectionClass = 'px-6 lg:px-12 py-32'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#03f7eb] text-[0.6rem] tracking-[5px] uppercase'
const dividerClass = 'h-px bg-white/10 mt-3 mb-6'
const heading2Class =
  "text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]"
const paragraphClass = 'text-white/50 text-base leading-relaxed'

const FEATURE_CARDS = [
  {
    bg: '/marketing/feature-cards/landscape-hilltop.jpg',
    image: '/marketing/invoices-table.svg',
    alt: 'Invoices table',
    title: 'Case management',
    body: 'Create cases, assign work, track progress, and generate reports in one click. Your team always knows where every matter stands.',
    href: '/product/case-management',
  },
  {
    bg: '/marketing/feature-cards/elephants-migration.jpg',
    image: '/marketing/ai-search.svg',
    alt: "UI of LegaLite's AI prompt search",
    title: 'Legal intelligence',
    body: 'Plain-English document queries. Instant judgment summaries. Side-by-side precedent comparison. Built on AI trained for both Ghanaian and international law.',
    href: '/product/legal-research',
  },
  {
    bg: '/marketing/feature-cards/desert-tree.jpg',
    image: '/marketing/billing.svg',
    alt: 'UI of case billing configuration',
    title: 'Practice management',
    body: 'Track billable hours, generate invoices, and see firm-wide performance at a glance. Real-time reports on finances, clients, cases, and team — without the spreadsheets.',
    href: null,
  },
]

const PRACTICE_FEATURES = [
  {
    title: 'Time tracking',
    body: 'Every billable hour captured. Every minute accounted for. Turn time data into firm-wide profitability insights — automatically.',
  },
  {
    title: 'Client and billing management',
    body: 'Generate invoices in one click, track payment status, and see who owes what at a glance — without ever opening a spreadsheet.',
  },
  {
    title: 'Reporting',
    body: 'Caseload, revenue, utilization, write-offs — every metric a managing partner needs, in real-time dashboards. Decisions on data, not guesswork.',
  },
]

export default function MarketingHome() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#1a2240_0%,#0A1622_50%)]"
          aria-hidden
        />
        <div className={sectionClass}>
          <div className={containerClass}>
            <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr] items-end">
              <h1 className="text-4xl md:text-5xl lg:text-6xl [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-[-1px] leading-[1.05] text-white">
                <strong className="font-semibold">
                  The intelligent management platform for modern legal practice.
                </strong>
              </h1>
              <div>
                <p className="text-white/50 text-base leading-relaxed max-w-md">
                  Cases, documents, billing, scheduling, and client communication — every moving piece of your practice, in one intelligent system. Spend your time on the law, not the logistics.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/contact-us"
                    className="inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white bg-gradient-to-b from-[#9D7C32] to-[#88661D] hover:opacity-90 transition shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]"
                  >
                    Request a demo
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white/90 border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 transition"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-20 relative rounded-3xl overflow-hidden mx-auto w-full">
              <div className="absolute inset-0" aria-hidden>
                <Image
                  src="/marketing/case-management/office.jpg"
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[#0A1622]/55" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A1622]/40 via-transparent to-[#0A1622]/70" />
              </div>
              <div className="relative px-6 py-10 md:px-16 md:py-20">
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl mx-auto max-w-[1200px]">
                  <Image
                    src="/marketing/legalite-app-ui.png"
                    alt="LegaLite dashboard preview"
                    width={1728}
                    height={972}
                    sizes="(max-width: 1200px) 90vw, 1200px"
                    priority
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Testimonials</div>
          <div className={dividerClass} />

          <div className="max-w-5xl mt-10">
            <h3 className={heading2Class}>
              Cases tracked. Documents organized. Billing automated. Research surfaced in seconds. LegaLite absorbs the operational weight of running a practice — leaving your team free to focus on strategy, not spreadsheets.
            </h3>
          </div>

          <div className="mt-24 grid gap-8 md:grid-cols-[1fr_auto] items-start">
            <div>
              <p className="text-xl md:text-2xl text-white [font-family:Literata,'Times_New_Roman',serif] leading-snug">
                &ldquo;LegaLite has changed the rhythm of how we run our practice. The admin work that used to eat into our days — pulling case files, tracking time, chasing deadlines — now just happens. We spend our hours on the law again.&rdquo;
              </p>
              <p className="mt-6 text-sm text-white/60">Placeholder Name, Managing Partner</p>
            </div>
            <div className="rounded-xl overflow-hidden">
              <Image
                src="/marketing/silhouette-placeholder.svg"
                alt=""
                width={300}
                height={360}
                className="w-44 h-auto"
              />
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
              Most legal software handles one thing well. LegaLite coordinates everything — case management, AI research, billing, and client communication — so your firm operates as one connected system instead of a stack of disconnected tools.
            </p>
            <h3 className={`${heading2Class} text-right`}>
              One platform. Every part of your practice.
            </h3>
          </div>

          <div className="mt-24 grid gap-8 md:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <div key={card.title} className="flex flex-col">
                <div
                  className="relative rounded-2xl overflow-hidden bg-cover bg-center bg-no-repeat aspect-[4/5] flex items-end justify-center p-6"
                  style={{ backgroundImage: `url(${card.bg})` }}
                >
                  <div className="w-full max-w-sm">
                    <Image
                      src={card.image}
                      alt={card.alt}
                      width={400}
                      height={300}
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="text-white text-lg [font-family:Inter,Arial,sans-serif] font-medium">
                    {card.title}
                  </h5>
                  <p className="mt-3 text-sm text-white/50 leading-relaxed">{card.body}</p>
                </div>

                {card.href && (
                  <div className="mt-6">
                    <Link
                      href={card.href}
                      className="inline-flex items-center rounded-full border border-white/10 px-5 py-2 text-sm text-white hover:bg-white/5 transition"
                    >
                      Learn more
                    </Link>
                  </div>
                )}
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
                  Trained exclusively on Ghanaian law — statutes, case law, and judicial precedent. Query documents in plain English, summarize judgments instantly, and compare precedents that actually apply to your jurisdiction.
                </p>
                <p className="text-white/40 text-sm leading-relaxed max-w-md">
                  We are currently optimized for Ghana&rsquo;s legal system.
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/5 p-6 bg-white/[0.02]">
              <Image
                src="/marketing/ai-search.svg"
                alt="UI of legalite AI search input"
                width={800}
                height={500}
                className="w-full h-auto"
              />
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
                Time logged. Invoices generated. Performance tracked. LegaLite runs the business side of your firm so you can focus on the practice.
              </p>

              <div className="mt-12">
                {PRACTICE_FEATURES.map((feature, i) => (
                  <div key={feature.title}>
                    <div className="h-px bg-white/10" />
                    <div className="py-6">
                      <h6 className="text-white text-base [font-family:Inter,Arial,sans-serif] font-medium">
                        {feature.title}
                      </h6>
                      <p className="mt-2 text-sm text-white/50 leading-relaxed">{feature.body}</p>
                    </div>
                    {i === PRACTICE_FEATURES.length - 1 && <div className="h-px bg-white/10" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] p-2">
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
      </section>

      <SecuritySection />
    </>
  )
}
