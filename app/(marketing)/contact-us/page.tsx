import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ContactForm } from '@/components/marketing/contact-form'
import { Reveal } from '@/components/marketing/reveal'
import { SectionMark } from '@/components/marketing/section-mark'
import { mk } from '@/lib/marketing-theme'

export const metadata: Metadata = {
  title: 'Request a demo',
}

const SOCIALS = [
  { href: 'https://x.com/LegaLite', label: 'X', icon: '/marketing/contact/x.svg' },
  {
    href: 'https://www.linkedin.com/company/legalitetech/',
    label: 'LinkedIn',
    icon: '/marketing/contact/linkedin.svg',
  },
]

export default function ContactUsPage() {
  return (
    <section className="px-6 lg:px-12 pt-12 pb-20 lg:pt-16 lg:pb-28">
      <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[1fr_minmax(0,500px)] lg:items-start lg:gap-16">
        <Reveal from="left">
          <SectionMark>Request a demo</SectionMark>
          <h1 className={`mt-6 ${mk.h1} lg:text-6xl`}>See LegaLite working in your practice.</h1>
          <p className={`mt-6 max-w-md ${mk.lead}`}>
            Tell us about your firm and we will set up a walkthrough around the way you
            already work.
          </p>

          <div className={`${mk.photo} ${mk.shadow} mt-10 aspect-[16/10]`}>
            <Image
              src="/marketing/photos/advocate-portrait.jpg"
              alt="A smiling lawyer seated in her office"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[center_25%]"
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[2px] text-[#0D1B2A]/50">
                General inquiries
              </div>
              <Link
                href="mailto:contact@legalite.app"
                className="mt-1 inline-block text-lg font-semibold text-[#0D1B2A] transition hover:text-[#A67A1C]"
              >
                contact@legalite.app
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {SOCIALS.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#0D1B2A] transition hover:bg-[#16283D]"
                >
                  <Image src={s.icon} alt="" width={18} height={18} className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal from="right" delay={140}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  )
}
