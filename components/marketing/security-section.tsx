import Image from 'next/image'
import Link from 'next/link'

const SECURITY_CARDS = [
  {
    title: 'ISO 27001 ready',
    body: 'Aligned with ISO 27001 Annex A controls covering access control, encryption, development practices, incident response, and continuity.',
    image: '/marketing/iso-27001.svg',
  },
  {
    title: 'SOC 2 ready',
    body: 'Built according to SOC 2 Trust Service Criteria',
    image: '/marketing/aipac-soc.svg',
  },
  {
    title: 'GDPR',
    body: 'Even though LegaLite does not primarily target the EU, we uphold GDPR principles for data subject rights and processing transparency.',
    image: '/marketing/hipaa-compliant.svg',
  },
]

export function SecuritySection() {
  return (
    <section className="px-6 lg:px-12 py-32">
      <div className="mx-auto max-w-[1600px]">
        <div className="text-[#03f7eb] text-[0.6rem] tracking-[5px] uppercase">Security</div>
        <div className="h-px bg-white/10 mt-3 mb-6" />

        <div className="mt-12 grid gap-10 lg:grid-cols-2 items-start">
          <h2 className="text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]">
            Built with the integrity the law demands
          </h2>
          <div>
            <p className="text-white/60 text-base leading-relaxed max-w-md">
              LegaLite is engineered with enterprise-grade security, compliance, and reliability at its core, giving law firms the confidence to build on technology they can trust.
            </p>
            <div className="mt-6">
              <Link
                href="/security-page"
                className="inline-flex items-center rounded-full border border-white/10 px-5 py-2 text-sm text-white hover:bg-white/5 transition"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10 mt-20" />

        <div className="grid md:grid-cols-3 gap-px bg-white/10 mt-px">
          {SECURITY_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-[#0A1622] p-8 flex flex-col justify-between gap-12 min-h-[280px]"
            >
              <div>
                <h4 className="text-xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold">
                  {card.title}
                </h4>
                <p className="mt-3 text-sm text-white/50 leading-relaxed">{card.body}</p>
              </div>
              <div>
                <Image
                  src={card.image}
                  alt=""
                  width={120}
                  height={60}
                  className="h-12 w-auto opacity-80"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="h-px bg-white/10" />
      </div>
    </section>
  )
}
