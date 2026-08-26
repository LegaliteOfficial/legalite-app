import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SecuritySection } from '@/components/marketing/security-section'
import {
  CaseAnalysisMockup,
  OutcomePrefMockup,
  PrecedentMockup,
  ReasoningMockup,
} from '@/components/marketing/legal-research-mockups'

export const metadata: Metadata = {
  title: 'Legal intelligence',
}

const sectionClass = 'px-6 lg:px-12 py-32'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase'
const dividerClass = 'h-px bg-white/10 mt-3 mb-6'
const heading2Class =
  "text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]"

export default function LegalResearchPage() {
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
              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-[-2px] leading-[0.9] text-white">
                Research that reads the case in front of you
              </h1>
              <div>
                <p className="text-white/50 text-base leading-relaxed max-w-md">
                  Tell LegaLite the outcome you are working toward, and it brings back the
                  authorities, insights, and approaches that move you closer to it.
                </p>
                <div className="mt-8">
                  <Link
                    href="/contact-us"
                    className="inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white bg-gradient-to-b from-[#9D7C32] to-[#88661D] hover:opacity-90 transition shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]"
                  >
                    Join waitlist
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-20 relative mx-auto w-full max-w-[1456px]">
              <div
                className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10"
                aria-hidden
                style={{
                  background:
                    'radial-gradient(55% 55% at 50% 0%, rgba(201,151,43,0.14), transparent 70%)',
                }}
              />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/marketing/research book.jpg"
                    alt="An open notebook, reading glasses and a planner on a desk"
                    fill
                    sizes="(max-width: 1456px) 100vw, 1456px"
                    priority
                    className="object-cover object-center"
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-0"
                  aria-hidden
                  style={{
                    background:
                      'linear-gradient(to top, rgba(7,10,15,0.6) 0%, rgba(7,10,15,0) 45%, rgba(7,10,15,0.2) 100%)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY PRINCIPLES (intro + outcome preference feature) */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>How it works</div>
          <div className={dividerClass} />

          <div className="mt-10 max-w-5xl">
            <h3 className={heading2Class}>
              Upload a document or describe the matter, and LegaLite maps the issues, the
              questions of law, the parties, and the angles worth arguing.
            </h3>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-2">
            {/* Case analysis — wide */}
            <div className="md:col-span-2 flex flex-col gap-8 rounded-2xl border border-white/10 bg-[#0A0E14] p-6 md:flex-row md:items-center md:p-8">
              <div className="md:w-[42%]">
                <h4 className="text-2xl md:text-3xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-tight">
                  It reads the case before you do
                </h4>
                <p className="mt-4 text-base text-white/50 leading-relaxed">
                  Drop in a document or describe the matter. LegaLite pulls out the issues,
                  the questions of law, the parties, and where the argument can go.
                </p>
              </div>
              <div className="md:flex-1">
                <CaseAnalysisMockup />
              </div>
            </div>

            {/* Outcome — narrow */}
            <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#0A0E14] p-6 md:p-8">
              <div>
                <h5 className="text-white text-lg [font-family:Inter,Arial,sans-serif] font-medium">
                  Set the outcome you want
                </h5>
                <p className="mt-3 text-sm text-white/50 leading-relaxed">
                  Tell it the result you are aiming for, and the research bends toward the
                  pathways that get you there.
                </p>
              </div>
              <div className="mt-auto">
                <OutcomePrefMockup />
              </div>
            </div>

            {/* Precedent — narrow */}
            <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#0A0E14] p-6 md:p-8">
              <div>
                <h5 className="text-white text-lg [font-family:Inter,Arial,sans-serif] font-medium">
                  The authorities that actually apply
                </h5>
                <p className="mt-3 text-sm text-white/50 leading-relaxed">
                  Instant access to the judgments, decisions, and statutes that line up with
                  your matter and your jurisdiction.
                </p>
              </div>
              <div className="mt-auto">
                <PrecedentMockup />
              </div>
            </div>

            {/* Reasoning — wide */}
            <div className="md:col-span-2 flex flex-col gap-8 rounded-2xl border border-white/10 bg-[#0A0E14] p-6 md:flex-row-reverse md:items-center md:p-8">
              <div className="md:w-[42%]">
                <h4 className="text-2xl md:text-3xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-tight">
                  Reasoning you can follow
                </h4>
                <p className="mt-4 text-base text-white/50 leading-relaxed">
                  For every case or strategy it suggests, LegaLite shows why it applies in
                  plain, checkable steps. No black box.
                </p>
              </div>
              <div className="md:flex-1">
                <ReasoningMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Why it matters</div>
          <div className={dividerClass} />

          <div className="mt-12 grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <h3 className={heading2Class}>
                Know sooner,
                <br />
                argue stronger
              </h3>
              <p className="mt-8 text-base text-white/60 leading-relaxed max-w-md">
                Point LegaLite at the matter and it does the reading for you: the
                authorities that fit, the precedents that hold, and the reasoning that ties
                them together. Less time lost in databases, more time shaping the case you
                mean to win.
              </p>
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-8 -z-10"
                aria-hidden
                style={{
                  background:
                    'radial-gradient(55% 55% at 55% 40%, rgba(201,151,43,0.14), transparent 70%)',
                }}
              />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/marketing/two lawyers.jpg"
                    alt="Two lawyers reviewing a document together"
                    fill
                    sizes="(max-width: 800px) 100vw, 800px"
                    className="object-cover object-center"
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-0"
                  aria-hidden
                  style={{
                    background:
                      'linear-gradient(to top, rgba(7,10,15,0.5) 0%, rgba(7,10,15,0) 50%)',
                  }}
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
