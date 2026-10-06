import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { SecuritySection } from '@/components/marketing/security-section'
import {
  CaseAnalysisMockup,
  OutcomePrefMockup,
  PrecedentMockup,
  ReasoningMockup,
} from '@/components/marketing/legal-research-mockups'
import { Reveal } from '@/components/marketing/reveal'
import { SectionMark } from '@/components/marketing/section-mark'
import { mk, serif } from '@/lib/marketing-theme'

export const metadata: Metadata = {
  title: 'Legal intelligence',
}

const cardClass = `${mk.card} flex flex-col gap-6 p-6 md:p-8`

export default function LegalResearchPage() {
  return (
    <>
      {/* HERO */}
      <section className="px-6 lg:px-12 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className={`${mk.container} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
          <Reveal from="up">
            <SectionMark>Legal intelligence</SectionMark>
            <h1 className={`mt-6 ${mk.h1}`}>Research that reads the case in front of you.</h1>
            <p className={`mt-6 max-w-md ${mk.lead}`}>
              Tell it the outcome you want. It brings back the authorities that get you
              there.
            </p>
            <Link href="/contact-us" className={`mt-8 ${mk.primaryCta}`}>
              See it in action
              <ArrowRight size={16} weight="bold" />
            </Link>
          </Reveal>
          <Reveal from="right" delay={120}>
            <div className={`${mk.photo} ${mk.shadow} aspect-[4/3]`}>
              <Image
                src="/marketing/photos/law-library.jpg"
                alt="Shelves of bound law reports in a law library"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`${mk.section} bg-white`}>
        <div className={mk.container}>
          <SectionMark>How it works</SectionMark>
          <h2 className={`mt-5 max-w-3xl ${mk.h2}`}>
            Describe the matter. LegaLite maps the issues and the law.
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <div className={`${cardClass} bg-[#F8F4EE] md:col-span-2 md:flex-row md:items-center`}>
              <div className="md:w-[40%]">
                <h3 className={mk.h3}>It reads the case before you do.</h3>
                <p className={`mt-3 ${mk.body}`}>Issues, questions of law, and parties, pulled out for you.</p>
              </div>
              <div className="md:flex-1">
                <CaseAnalysisMockup />
              </div>
            </div>

            <div className={`${cardClass} bg-[#F8F4EE]`}>
              <div>
                <h3 className="text-lg font-semibold">Set the outcome you want.</h3>
                <p className={`mt-2 ${mk.body}`}>The research bends toward it.</p>
              </div>
              <div className="mt-auto">
                <OutcomePrefMockup />
              </div>
            </div>

            <div className={`${cardClass} bg-[#F8F4EE]`}>
              <div>
                <h3 className="text-lg font-semibold">The authorities that apply.</h3>
                <p className={`mt-2 ${mk.body}`}>Judgments and statutes matched to your jurisdiction.</p>
              </div>
              <div className="mt-auto">
                <PrecedentMockup />
              </div>
            </div>

            <div className={`${cardClass} bg-[#F8F4EE] md:col-span-2 md:flex-row-reverse md:items-center`}>
              <div className="md:w-[40%]">
                <h3 className={mk.h3}>Reasoning you can follow.</h3>
                <p className={`mt-3 ${mk.body}`}>Every suggestion explained in plain, checkable steps.</p>
              </div>
              <div className="md:flex-1">
                <ReasoningMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS: full-bleed photo */}
      <section className="relative overflow-hidden px-6 lg:px-12 py-28 lg:py-40">
        <Image
          src="/marketing/photos/lawyer-at-laptop.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B2A]/90 via-[#0D1B2A]/60 to-transparent" aria-hidden />
        <div className={`${mk.container} relative`}>
          <SectionMark light>Why it matters</SectionMark>
          <h2 className={`mt-5 max-w-xl text-4xl sm:text-5xl lg:text-6xl text-white ${serif} font-semibold tracking-tight leading-[1.04]`}>
            Know sooner. Argue stronger.
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/75">
            Less time lost in databases, more time shaping the case you mean to win.
          </p>
        </div>
      </section>

      <SecuritySection />
    </>
  )
}
