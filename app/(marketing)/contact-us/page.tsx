import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ContactForm } from '@/components/marketing/contact-form'
import { Reveal } from '@/components/marketing/reveal'

export const metadata: Metadata = {
  title: 'Request a demo',
}

const eyebrowClass = 'text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase'

export default function ContactUsPage() {
  return (
    <section className="relative isolate overflow-hidden">
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

      {/* Centred background illustration. Sits behind the content at low
          opacity so the page keeps its own slate colour and the form stays
          readable over it. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden items-center justify-center overflow-hidden md:flex"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/demo-request.svg"
          alt=""
          className="w-[min(78vw,520px)] max-h-[80%] object-contain opacity-[0.35] md:-translate-x-[26%]"
        />
      </div>

      <div className="px-6 lg:px-12 py-16 lg:py-20">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-12 lg:gap-14 lg:grid-cols-[1fr_minmax(0,500px)] items-start">
            {/* Left — heading + contact */}
            <Reveal from="left">
              <div className={eyebrowClass}>Request a demo</div>

              <h1 className="mt-6 text-4xl md:text-6xl lg:text-[4.25rem] [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-[-1.5px] leading-[1] text-white">
                See LegaLite working in your practice.
              </h1>

              <p className="mt-6 text-white/55 text-base leading-relaxed max-w-md">
                Add your details and we will set up a walkthrough of how LegaLite fits
                the way your practice already works.
              </p>

              <div className="mt-8">
                <div className="text-sm text-white/50">General inquiries</div>
                <Link
                  href="mailto:contact@legalite.app"
                  className="mt-2 inline-block text-lg text-white transition hover:text-white/70"
                >
                  contact@legalite.app
                </Link>
              </div>

              <div className="mt-10">
                <div className="text-sm text-white/50">Socials</div>
                <div className="mt-3 flex items-center gap-4">
                  <Link
                    href="https://x.com/LegaLite"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="X"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition hover:border-[#C9972B]/30 hover:bg-white/5"
                  >
                    <Image src="/marketing/contact/x.svg" alt="" width={18} height={18} className="h-4 w-4" />
                  </Link>
                  <Link
                    href="https://www.linkedin.com/company/legalitetech/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition hover:border-[#C9972B]/30 hover:bg-white/5"
                  >
                    <Image src="/marketing/contact/linkedin.svg" alt="" width={18} height={18} className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Right — form */}
            <Reveal from="right" delay={140}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
