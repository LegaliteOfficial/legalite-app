import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { SecuritySection } from '@/components/marketing/security-section'
import { CaseDashboardDemo } from '@/components/marketing/case-dashboard-demo'
import {
  CollaborationMockup,
  DocumentsMockup,
  CaseLifecycleMockup,
} from '@/components/marketing/case-feature-mockups'
import { Reveal } from '@/components/marketing/reveal'
import { SectionMark } from '@/components/marketing/section-mark'
import { mk, serif } from '@/lib/marketing-theme'

export const metadata: Metadata = {
  title: 'Case management',
}

const FEATURES = [
  {
    n: '01',
    title: 'In house and external counsel on the same page.',
    body: 'Hand off matters, comment, and shape documents side by side.',
    image: '/marketing/photos/team-meeting.jpg',
    alt: 'Lawyers discussing a matter around a table',
    mockup: 'collab',
  },
  {
    n: '02',
    title: 'One home for every document.',
    body: 'Each file stays with its matter, from intake to close.',
    image: '/marketing/case-management/office.jpg',
    alt: 'A sunlit office desk with case binders and a laptop',
    mockup: 'docs',
  },
  {
    n: '03',
    title: 'From intake to judgment.',
    body: 'Every stage tracked, so nothing slips under a heavy caseload.',
    image: '/marketing/photos/partner-meeting.jpg',
    alt: 'A senior lawyer in a meeting at his desk',
    mockup: 'lifecycle',
  },
] as const

export default function CaseManagementPage() {
  return (
    <>
      {/* HERO */}
      <section className="px-6 lg:px-12 pt-12 pb-16 lg:pt-16">
        <div className={`${mk.container} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
          <Reveal from="up">
            <SectionMark>Case management</SectionMark>
            <h1 className={`mt-6 ${mk.h1}`}>Every case, every client, every detail.</h1>
            <p className={`mt-6 max-w-md ${mk.lead}`}>
              One workspace that keeps your team coordinated and every matter moving.
            </p>
            <Link href="/contact-us" className={`mt-8 ${mk.primaryCta}`}>
              See it in action
              <ArrowRight size={16} weight="bold" />
            </Link>
          </Reveal>
          <Reveal from="right" delay={120}>
            <div className={`${mk.photo} ${mk.shadow} aspect-[4/3]`}>
              <Image
                src="/marketing/photos/lawyer-reviewing-file.jpg"
                alt="A lawyer reviewing a case file beside his laptop"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* LIVE DEMO */}
      <section className="bg-[#0D1B2A] px-6 lg:px-12 py-16 lg:py-20">
        <div className={mk.container}>
          <div className="mx-auto max-w-[1040px]">
            <SectionMark light>Your caseload, live</SectionMark>
            <div className="mt-8">
              <CaseDashboardDemo />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES: each mockup sits over a real photo */}
      <section className={mk.section}>
        <div className={mk.container}>
          <SectionMark>Built for teams</SectionMark>
          <h2 className={`mt-5 max-w-3xl ${mk.h2}`}>Your whole team, working as one.</h2>

          <div className="mt-16 flex flex-col gap-20 lg:gap-28">
            {FEATURES.map((f, i) => (
              <div key={f.n} className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
                <div className={`min-w-0 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className={`${serif} text-lg text-[#A67A1C]`}>&sect;&nbsp;{f.n}</div>
                  <h3 className={`mt-3 text-3xl md:text-4xl ${serif} font-semibold tracking-tight leading-tight`}>
                    {f.title}
                  </h3>
                  <p className={`mt-4 max-w-md ${mk.lead}`}>{f.body}</p>
                </div>
                <Reveal from={i % 2 === 1 ? 'left' : 'right'} className="min-w-0">
                  <div className="relative sm:pb-16">
                    <div className={`${mk.photo} aspect-[4/3]`}>
                      <Image
                        src={f.image}
                        alt={f.alt}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="relative mx-4 -mt-20 sm:absolute sm:bottom-0 sm:right-6 sm:mx-0 sm:mt-0 sm:w-[78%]">
                      {f.mockup === 'collab' && <CollaborationMockup />}
                      {f.mockup === 'docs' && <DocumentsMockup />}
                      {f.mockup === 'lifecycle' && <CaseLifecycleMockup />}
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS: full-bleed photo */}
      <section className="relative overflow-hidden px-6 lg:px-12 py-28 lg:py-40">
        <Image
          src={encodeURI('/marketing/two lawyers.jpg')}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B2A]/90 via-[#0D1B2A]/60 to-transparent" aria-hidden />
        <div className={`${mk.container} relative`}>
          <SectionMark light>Why it matters</SectionMark>
          <h2 className={`mt-5 max-w-xl text-4xl sm:text-5xl lg:text-6xl text-white ${serif} font-semibold tracking-tight leading-[1.04]`}>
            Less time managing. More time practising.
          </h2>
        </div>
      </section>

      <SecuritySection />
    </>
  )
}
