import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Database, LockKey, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { mk } from '@/lib/marketing-theme'
import { SectionMark } from '@/components/marketing/section-mark'

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

const DEFAULT_FACTS = [
  { value: 'AES-256', label: 'Stored data' },
  { value: 'TLS 1.2+', label: 'Data in transit' },
  { value: 'Per firm', label: 'Data isolation' },
  { value: 'Role based', label: 'Access control' },
]

interface TrustFact {
  value: string
  label: string
}

export function SecuritySection({ facts = DEFAULT_FACTS }: { facts?: TrustFact[] }) {
  return (
    <section className={`${mk.section} bg-white`}>
      <div className={`${mk.container} grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20`}>
        <div className={`${mk.photo} ${mk.shadow} aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]`}>
          <Image
            src="/marketing/photos/signing-documents.jpg"
            alt="A client signing documents across the desk from their lawyer"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
          <dl className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-[#0D1B2A]/10 sm:inset-x-6 sm:bottom-6 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.value} className="flex flex-col gap-0.5 bg-white/95 px-4 py-3 backdrop-blur">
                <dt className="text-[11px] text-[#0D1B2A]/55">{fact.label}</dt>
                <dd className="order-first text-base font-semibold text-[#0D1B2A]">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <SectionMark>Security</SectionMark>
          <h2 className={`mt-5 ${mk.h2}`}>Built with the integrity the law demands.</h2>
          <p className={`mt-5 max-w-lg ${mk.lead}`}>
            Your clients trust you with their most sensitive matters. We hold your data to
            the same standard.
          </p>

          <ul className="mt-10 space-y-6">
            {PRINCIPLES.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C9972B]/15 text-[#A67A1C]">
                  <Icon size={22} weight="duotone" />
                </span>
                <div>
                  <h3 className="font-semibold text-[#0D1B2A]">{title}</h3>
                  <p className="mt-1 text-sm text-[#0D1B2A]/60 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link href="/security-page" className={`mt-10 ${mk.textLink}`}>
            How we protect your data
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  )
}
