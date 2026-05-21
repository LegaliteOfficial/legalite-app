import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SecuritySection } from '@/components/marketing/security-section'

export const metadata: Metadata = {
  title: 'Case management',
}

const sectionClass = 'px-6 lg:px-12 py-32'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#03f7eb] text-[0.6rem] tracking-[5px] uppercase'
const dividerClass = 'h-px bg-white/10 mt-3 mb-6'
const heading2Class =
  "text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]"

const FEATURES = [
  {
    title: 'Collaborate with your in-house and external consult',
    body: 'Assign cases, share comment, and collaborate on documents seamlessly. LegaLite ensures everyone stays informed and aligned.',
    image: '/marketing/case-management/feature-collaborate.jpg',
    imageRight: false,
  },
  {
    title: 'All your documents accessible to all team members',
    body: 'Track every case and related documents from start to finish with real-time updates and smart task automation that keeps your team on schedule.',
    image: '/marketing/case-management/feature-documents.jpg',
    imageRight: true,
  },
  {
    title: 'Smart advance case management',
    body: 'From client intake to judgment, streamline your entire case lifecycle with tools that centralize files, surface critical information, and ensure nothing falls through the cracks — even when handling heavy caseloads.',
    image: '/marketing/case-management/feature-smart-mgmt.jpg',
    imageRight: false,
  },
]

export default function CaseManagementPage() {
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
                  Stay on top of every case, every client, every detail
                </strong>
              </h1>
              <div>
                <p className="text-white/50 text-base leading-relaxed max-w-md">
                  Organize, track, and manage every case in one intelligent workspace. LegaLite keeps your team coordinated and your practice running smoothly.
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
                src="/marketing/case-management/lawyer.png"
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

      {/* COLLABORATIVE WORKSPACE FEATURES */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Security principles</div>
          <div className={dividerClass} />

          <div className="mt-10 max-w-5xl">
            <h3 className={heading2Class}>
              A collaborative AI workspace for lawyers, with tools that fit seamlessly into the way you already work.
            </h3>
          </div>

          <div className="mt-24 flex flex-col gap-24">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="grid gap-10 lg:grid-cols-2 items-center"
              >
                <div className={feature.imageRight ? 'lg:order-2' : ''}>
                  <h3 className="text-2xl md:text-4xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-5 text-base text-white/50 leading-relaxed max-w-md">
                    {feature.body}
                  </p>
                </div>
                <div className={`rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] ${feature.imageRight ? 'lg:order-1' : ''}`}>
                  <Image
                    src={feature.image}
                    alt=""
                    width={2050}
                    height={1300}
                    sizes="(max-width: 2050px) 100vw, 2050px"
                    className="w-full h-auto"
                  />
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
              src="/marketing/case-management/office.jpg"
              alt=""
              width={2218}
              height={1300}
              sizes="(max-width: 2218px) 100vw, 2218px"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      <SecuritySection />
    </>
  )
}
