import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SecuritySection } from '@/components/marketing/security-section'

export const metadata: Metadata = {
  title: 'Legal Research New',
}

const sectionClass = 'px-6 lg:px-12 py-32'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#03f7eb] text-[0.6rem] tracking-[5px] uppercase'
const dividerClass = 'h-px bg-white/10 mt-3 mb-6'
const heading2Class =
  "text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]"

const FEATURE_CARDS = [
  {
    bg: 'https://cdn.prod.website-files.com/68ef1d93f623ba0ab0e265a0/692851adf63034fa202ac34c_outcome.jpg',
    title: 'Outcome preference settings',
    body: 'Specify the outcome you aim for, and LegaLite adjusts its research to focus on the most relevant legal pathways.',
  },
  {
    bg: 'https://cdn.prod.website-files.com/68ef1d93f623ba0ab0e265a0/692853b1315fff9ad8b156bd_AI.jpg',
    title: 'Precedent and case law surfacing',
    body: 'Get instant access to the most relevant judgments, past decisions, and authorities that align with your goal.',
  },
  {
    bg: 'https://cdn.prod.website-files.com/68ef1d93f623ba0ab0e265a0/6928543dbd359e8a5bc3e5c8_namos%20.jpg',
    title: 'Evidence-based reasoning',
    body: (
      <>
        For each recommended case or strategy, LegaLite explains <em>why</em> it is relevant using transparent, interpretable reasoning. No black-box conclusions.
      </>
    ),
  },
]

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
                <strong className="font-semibold">
                  Legal research that understands your case
                </strong>
              </h1>
              <div>
                <p className="text-white/50 text-base leading-relaxed max-w-md">
                  Define the result you want, and LegaLite surfaces the key authorities, legal insights, and recommended approaches that align with your goal.
                </p>
                <div className="mt-8">
                  <Link
                    href="/contact-us"
                    className="inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium text-white bg-gradient-to-b from-[#9D7C32] to-[#88661D] hover:opacity-90 transition shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]"
                  >
                    Request a demo
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-20 rounded-2xl overflow-hidden">
              <Image
                src="/marketing/legal-research/legal-research.png"
                alt=""
                width={1456}
                height={900}
                sizes="(max-width: 1456px) 100vw, 1456px"
                priority
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY PRINCIPLES (intro + outcome preference feature) */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Security principles</div>
          <div className={dividerClass} />

          <div className="mt-10 max-w-5xl">
            <h3 className={heading2Class}>
              Upload or describe your case, and LegaLite automatically identifies the key issues, legal questions, parties involved, and possible angles of argument.
            </h3>
          </div>

          <div className="mt-24 grid gap-10 lg:grid-cols-2 items-center">
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
              <Image
                src="/marketing/legal-research/outcome-preference.jpg"
                alt=""
                width={1621}
                height={1000}
                sizes="(max-width: 1621px) 100vw, 1621px"
                className="w-full h-auto"
              />
            </div>
            <div>
              <h4 className="text-2xl md:text-4xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-tight">
                <strong>Outcome preference setting</strong>
              </h4>
              <p className="mt-5 text-base text-white/50 leading-relaxed max-w-md">
                Specify the outcome you aim for, and LegaLite adjusts its research to focus on the most relevant legal pathways.
              </p>
            </div>
          </div>

          <div className="mt-24 grid gap-8 md:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <div key={card.title} className="flex flex-col">
                <div
                  className="relative rounded-2xl overflow-hidden bg-cover bg-center bg-no-repeat aspect-[4/5]"
                  style={{ backgroundImage: `url(${card.bg})` }}
                />
                <div className="mt-6">
                  <h5 className="text-white text-lg [font-family:Inter,Arial,sans-serif] font-medium">
                    {card.title}
                  </h5>
                  <p className="mt-3 text-sm text-white/50 leading-relaxed">{card.body}</p>
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
              LegaLite eliminates the friction in your daily operations. With a unified case view and automation built in, your firm spends less time on admin work and more time on what truly matters — serving clients and winning cases.
            </p>
          </div>

          <div className="mt-20 rounded-2xl overflow-hidden">
            <Image
              src="/marketing/legal-research/laptop.png"
              alt=""
              width={1024}
              height={700}
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      <SecuritySection />
    </>
  )
}
