import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Database, LockKey, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { FAQAccordion } from '@/components/marketing/faq-accordion'
import { Reveal } from '@/components/marketing/reveal'
import { SectionMark } from '@/components/marketing/section-mark'
import { mk } from '@/lib/marketing-theme'

export const metadata: Metadata = {
  title: 'Security',
}

const FACTS = [
  { value: 'AES-256', label: 'Encryption at rest' },
  { value: 'TLS 1.2+', label: 'Encryption in transit' },
  { value: 'Per firm', label: 'Data isolation' },
  { value: 'Role based', label: 'Access control' },
]

const PRINCIPLES = [
  {
    Icon: LockKey,
    title: 'Isolated and encrypted',
    body: 'Each firm is walled off at the database and encrypted in transit and at rest.',
  },
  {
    Icon: ShieldCheck,
    title: 'Private from the AI',
    body: 'The assistant only sees what you ask it. Records are never pooled across firms.',
  },
  {
    Icon: Database,
    title: 'Never used for training',
    body: 'Your documents and client data do not train our models without your consent.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'How does LegaLite keep your data secured?',
    answer:
      'At LegaLite, protecting your data is our top priority. All data is encrypted in transit using TLS 1.2 or higher, and at rest with AES-256 encryption. For customers who require additional control, we also offer the option to encrypt data with their own encryption keys. If this is of interest, please let us know.',
  },
  {
    question: 'What happens to our data once we stop using LegaLite?',
    answer:
      'Once your contract ends, all of your data, along with any dedicated storage resources associated with your account, is permanently deleted. Before this happens, you’ll have the opportunity to request a full export of your data to ensure you retain everything you need.',
  },
]

export default function SecurityPage() {
  return (
    <>
      {/* HERO */}
      <section className="px-6 lg:px-12 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className={`${mk.container} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
          <Reveal from="up">
            <SectionMark>Security</SectionMark>
            <h1 className={`mt-6 ${mk.h1}`}>Security built in. Trust earned.</h1>
            <p className={`mt-6 max-w-md ${mk.lead}`}>
              Your data stays secure, private, and under your control.
            </p>
            <Link href="/contact-us" className={`mt-8 ${mk.primaryCta}`}>
              See it in action
              <ArrowRight size={16} weight="bold" />
            </Link>
            <p className="mt-6 max-w-md text-sm text-[#0D1B2A]/50">
              We follow established security practices today. This page will be updated as
              our security programme grows.
            </p>
          </Reveal>
          <Reveal from="right" delay={120}>
            <div className={`${mk.photo} ${mk.shadow} aspect-[4/3]`}>
              <Image
                src="/marketing/photos/signing-documents.jpg"
                alt="A client signing documents across the desk from their lawyer"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className={`${mk.section} bg-white`}>
        <div className={mk.container}>
          <SectionMark>Security principles</SectionMark>
          <h2 className={`mt-5 max-w-3xl ${mk.h2}`}>Security, privacy, and resilience in every part.</h2>

          <dl className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.value} className="flex flex-col gap-1 rounded-2xl bg-[#0D1B2A] p-6 text-white">
                <dt className="text-sm text-white/65">{f.label}</dt>
                <dd className="order-first text-2xl font-semibold text-[#F2C65A]">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map(({ Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-[#0D1B2A]/[0.08] bg-[#F8F4EE] p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C9972B]/15 text-[#A67A1C]">
                  <Icon size={22} weight="duotone" />
                </span>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className={`mt-2 ${mk.body}`}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOMER CONTROLS */}
      <section className={mk.section}>
        <div className={`${mk.container} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16`}>
          <div className={`${mk.photo} ${mk.shadow} aspect-[4/3] lg:order-2`}>
            <Image
              src="/marketing/photos/lawyer-on-sofa.jpg"
              alt="A lawyer working on a laptop"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[center_30%]"
            />
          </div>
          <div>
            <SectionMark>Customer controls</SectionMark>
            <h2 className={`mt-5 ${mk.h2}`}>You own your data.</h2>
            <p className={`mt-5 max-w-md ${mk.lead}`}>
              Export everything at any time, or permanently delete your account whenever you
              choose.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`${mk.section} bg-white`}>
        <div className={`${mk.container} grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start`}>
          <div>
            <SectionMark>Questions</SectionMark>
            <h2 className={`mt-5 ${mk.h2}`}>FAQs</h2>
          </div>
          <FAQAccordion items={FAQ_ITEMS} />
        </div>
      </section>
    </>
  )
}
