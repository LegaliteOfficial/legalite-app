import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { FAQAccordion } from '@/components/marketing/faq-accordion'

export const metadata: Metadata = {
  title: 'Security page',
}

const sectionClass = 'px-6 lg:px-12 py-32'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#03f7eb] text-[0.6rem] tracking-[5px] uppercase'
const dividerClass = 'h-px bg-white/10 mt-3 mb-6'
const heading2Class =
  "text-3xl md:text-5xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-[1.05]"

const COMPLIANCE_ITEMS = [
  {
    title: 'SOC 2 ready',
    body: 'Built according to SOC 2 Trust Service Criteria',
  },
  {
    title: 'ISO 27001 & 27002 compliant',
    body: 'Aligned with ISO 27001 Annex A controls covering access control, encryption, development practices, incident response, and continuity.',
  },
  {
    title: 'GDPR compliant',
    body: 'Even though LegaLite does not primarily target the EU, we uphold GDPR principles for data subject rights and processing transparency.',
  },
  {
    title: 'Ghana data protection',
    body: 'LegaLite is built around the 8 Data Protection Principles, incorporating purpose limitation, data minimization, support for user rights such as access, correction, and deletion, ongoing registration with the Data Protection Commission, and safeguards for cross-border data transfers.',
  },
]

const ACCESS_CONTROL_ITEMS = [
  { title: 'Authentication', body: 'Secure login, hashed passwords, protected sessions' },
  {
    title: 'Role-Based Access Control (RBAC)',
    body: 'Workspace permissions and case-level access',
  },
  {
    title: 'Authorization Enforcement',
    body: 'Strict checks across all platform resources',
  },
  {
    title: 'Audit logs',
    body: 'Detailed history of activities, actions, and document events',
  },
  {
    title: 'Session management',
    body: 'Short-lived tokens and automatic revocation on logout',
  },
]

const DATA_PROTECTION_ITEMS = [
  {
    title: 'End-to-End Encryption & Key Management',
    body: 'TLS 1.2+ encryption in transit, AES-256 encryption at rest, secure document storage, and provider-managed encryption keys.',
  },
  {
    title: 'Strong Data Governance',
    body: 'Secure secrets management, defined retention controls, and protected access-controlled file handling.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Do you have SOC 2 / ISO 27001 certification?',
    answer:
      'Not yet. We are actively working toward SOC 2 Type II and have ISO 27001 in our roadmap. We publish audit results and certificates here when available.',
  },
  {
    question: 'How does LegaLite keep your data secured?',
    answer:
      'At LegaLite, protecting your data is our top priority. All data is encrypted in transit using TLS 1.2 or higher, and at rest with AES-256 encryption. For customers who require additional control, we also offer the option to encrypt data with their own encryption keys. If this is of interest, please let us know.',
  },
  {
    question: 'What happens to our data once we stop using LegaLite?',
    answer:
      'Once your contract ends, all of your data — along with any dedicated storage resources associated with your account — is permanently deleted. Before this happens, you’ll have the opportunity to request a full export of your data to ensure you retain everything you need.',
  },
]

interface CategoryGroup {
  heading: string
  intro: string
  items: { title: string; body: string }[]
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    heading: 'Compliance & certifications',
    intro: 'LegaLite aligns with leading security and privacy frameworks.',
    items: COMPLIANCE_ITEMS,
  },
  {
    heading: 'Access controls',
    intro: 'LegaLite provides robust, granular control over user and workspace permissions.',
    items: ACCESS_CONTROL_ITEMS,
  },
  {
    heading: 'Data protection',
    intro: 'We ensure that all legal information is protected end-to-end.',
    items: DATA_PROTECTION_ITEMS,
  },
]

export default function SecurityPage() {
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
              <div>
                <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-[-2px] leading-[0.95] text-white">
                  <strong className="font-semibold">Security built-in. trust earned.</strong>
                </h1>

                <div className="mt-10 flex items-center gap-6">
                  <Image
                    src="/marketing/security/badge-1.svg"
                    alt=""
                    width={80}
                    height={80}
                    className="h-16 w-auto"
                  />
                  <Image
                    src="/marketing/security/badge-2.svg"
                    alt=""
                    width={80}
                    height={80}
                    className="h-16 w-auto"
                  />
                  <Image
                    src="/marketing/hipaa-compliant.svg"
                    alt=""
                    width={80}
                    height={80}
                    className="h-16 w-auto"
                  />
                </div>

                <p className="mt-8 text-sm text-white/50 max-w-xl">
                  We follow security best practices today and are actively pursuing formal certifications. This page will be updated as we achieve them.
                </p>
              </div>

              <div>
                <p className="text-white/70 text-base leading-relaxed max-w-md">
                  From encryption to access management, LegaLite enforces rigorous standards to ensure your data stays secure, private, and compliant.
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
          </div>
        </div>
      </section>

      {/* SECURITY PRINCIPLES */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Security principles</div>
          <div className={dividerClass} />

          <div className="mt-10 max-w-5xl">
            <h3 className={heading2Class}>
              Your business deserves a partner you can trust. That&rsquo;s why we design every element of LegaLite with security, privacy, and resilience in mind.
            </h3>
          </div>

          <div className="mt-24 flex flex-col gap-16">
            {CATEGORY_GROUPS.map((group, i) => (
              <div key={group.heading}>
                <div className="grid gap-12 lg:grid-cols-[1fr_2fr] items-start">
                  <div>
                    <h4 className="text-2xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight">
                      {group.heading}
                    </h4>
                    <p className="mt-4 text-base text-white/50 leading-relaxed max-w-sm">
                      {group.intro}
                    </p>
                  </div>
                  <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <div key={item.title}>
                        <h5 className="text-white text-lg [font-family:Inter,Arial,sans-serif] font-medium">
                          {item.title}
                        </h5>
                        <p className="mt-3 text-sm text-white/50 leading-relaxed">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {i < CATEGORY_GROUPS.length - 1 && (
                  <div className="h-px bg-white/10 mt-16" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOMER CONTROLS */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Customer controls</div>
          <div className={dividerClass} />

          <div className="mt-10 max-w-4xl">
            <h3 className={heading2Class}>You own your data</h3>
            <p className="mt-8 text-base text-white/60 leading-relaxed max-w-3xl">
              You can export all your data at any time, and you have the option to permanently delete your account whenever you choose. Beyond that, our enterprise-grade security controls give you full authority over where your data is stored, how long it&rsquo;s retained, how encryption keys are managed, and complete visibility into how your information is handled across the platform.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Frequently asked questions</div>
          <div className={dividerClass} />

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.4fr] items-start">
            <div>
              <h3 className={heading2Class}>FAQs</h3>
              <p className="mt-8 text-base text-white/60 leading-relaxed max-w-md">
                You own your data. We do not use customer data for model training or secondary commercial purposes. You can request exports, see audit logs, and ask for deletions — we provide clear controls in the product and contractual guarantees for enterprise agreements.
              </p>
            </div>
            <FAQAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>
    </>
  )
}
