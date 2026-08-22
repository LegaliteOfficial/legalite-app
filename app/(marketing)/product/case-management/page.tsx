import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SecuritySection } from '@/components/marketing/security-section'
import { CaseDashboardDemo } from '@/components/marketing/case-dashboard-demo'
import {
  CollaborationMockup,
  DocumentsMockup,
  CaseLifecycleMockup,
} from '@/components/marketing/case-feature-mockups'

export const metadata: Metadata = {
  title: 'Case management',
}

const sectionClass = 'px-6 lg:px-12 py-32'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase'
const dividerClass = 'h-px bg-white/10 mt-3 mb-6'
const heading2Class =
  "text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]"

const FEATURES = [
  {
    title: 'Keep in house and external counsel on the same page',
    body: 'Hand off matters, leave comments, and shape documents side by side. Everyone sees the latest, no matter where they sit.',
    mockup: 'collab',
    imageRight: false,
  },
  {
    title: 'One home for every document your team needs',
    body: 'Follow each matter and its files from intake to close, with live updates and automation that keeps the whole team on schedule.',
    mockup: 'docs',
    imageRight: true,
  },
  {
    title: 'Run the case from intake to judgment',
    body: 'Move each matter through every stage with files in one place, the details that matter surfaced, and nothing slipping, even under a heavy caseload.',
    mockup: 'lifecycle',
    imageRight: false,
  },
]

export default function CaseManagementPage() {
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
        <div className={sectionClass}>
          <div className={containerClass}>
            <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr] items-end">
              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-[-2px] leading-[0.9] text-white">
                Stay on top of every case, every client, every detail
              </h1>
              <div>
                <p className="text-white/50 text-base leading-relaxed max-w-md">
                  Organize, track, and manage every case in one intelligent workspace.
                  LegaLite keeps your team coordinated and your practice running smoothly.
                </p>
                <div className="mt-8">
                  <Link
                    href="/contact-us"
                    className="inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white bg-gradient-to-b from-[#C9972B] to-[#8C6A1E] hover:opacity-90 transition shadow-[0_1px_0_rgba(255,255,255,0.2)_inset]"
                  >
                    Join waitlist
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-20 relative mx-auto w-full max-w-[1040px]">
              <div
                className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10"
                aria-hidden
                style={{
                  background:
                    'radial-gradient(55% 55% at 50% 0%, rgba(201,151,43,0.14), transparent 70%)',
                }}
              />
              <CaseDashboardDemo />
            </div>
          </div>
        </div>
      </section>

      {/* COLLABORATIVE WORKSPACE FEATURES */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Built for teams</div>
          <div className={dividerClass} />

          <div className="mt-10 max-w-5xl">
            <h3 className={heading2Class}>
              An AI workspace where your whole team works as one, shaped around the way
              your firm already operates.
            </h3>
          </div>

          <div className="mt-24 flex flex-col gap-24">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="grid gap-10 lg:grid-cols-2 items-center">
                <div className={feature.imageRight ? 'lg:order-2' : ''}>
                  <h3 className="text-2xl md:text-4xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-5 text-base text-white/50 leading-relaxed max-w-md">
                    {feature.body}
                  </p>
                </div>
                <div className={feature.imageRight ? 'lg:order-1' : ''}>
                  {feature.mockup === 'collab' && <CollaborationMockup />}
                  {feature.mockup === 'docs' && <DocumentsMockup />}
                  {feature.mockup === 'lifecycle' && <CaseLifecycleMockup />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Why it matters</div>
          <div className={dividerClass} />

          <div className="mt-12 max-w-5xl">
            <h3 className={heading2Class}>
              Less time managing,
              <br />
              more time practicing
            </h3>
            <p className="mt-8 text-base text-white/60 leading-relaxed max-w-2xl">
              LegaLite removes the friction in your daily operations. With a unified case
              view and automation built in, your firm spends less time on admin work and
              more time on what truly matters, serving clients and winning cases.
            </p>
          </div>

          <div className="mt-16 relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
            <div className="relative aspect-[16/9]">
              <Image
                src="/marketing/two lawyers.jpg"
                alt="Two lawyers reviewing a document together"
                fill
                sizes="(max-width: 1600px) 100vw, 1600px"
                className="object-cover object-center"
              />
            </div>
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background:
                  'linear-gradient(to top, rgba(7,10,15,0.65) 0%, rgba(7,10,15,0) 40%, rgba(7,10,15,0.2) 100%)',
              }}
            />
          </div>
        </div>
      </section>

      <SecuritySection />
    </>
  )
}
