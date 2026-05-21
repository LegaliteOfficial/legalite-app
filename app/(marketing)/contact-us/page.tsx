import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ContactForm } from '@/components/marketing/contact-form'

export const metadata: Metadata = {
  title: 'Contact us',
}

const sectionClass = 'px-6 lg:px-12 py-32'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#03f7eb] text-[0.6rem] tracking-[5px] uppercase'

export default function ContactUsPage() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#1a2240_0%,#0A1622_50%)]"
        aria-hidden
      />
      <div className={sectionClass}>
        <div className={containerClass}>
          <div className={eyebrowClass}>Get access to the product</div>

          <div className="mt-10 grid gap-16 lg:grid-cols-2 items-start">
            {/* Left column — heading + contact info */}
            <div>
              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-[-2px] leading-[0.95] text-white">
                <strong className="font-semibold">Reach out to see it in action</strong>
              </h1>

              <div className="mt-12">
                <div className="text-sm text-white/50">General inquiries</div>
                <Link
                  href="mailto:contact@legalite.app"
                  className="mt-2 inline-block text-lg text-white hover:text-white/80 [font-family:Inter,Arial,sans-serif]"
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
                    aria-label="X (Twitter)"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 hover:bg-white/5 transition"
                  >
                    <Image
                      src="/marketing/contact/x.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="h-4 w-4"
                    />
                  </Link>
                  <Link
                    href="https://www.linkedin.com/company/legalitetech/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 hover:bg-white/5 transition"
                  >
                    <Image
                      src="/marketing/contact/linkedin.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="h-4 w-4"
                    />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right column — form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
