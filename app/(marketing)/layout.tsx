import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SOCIAL_PROFILE_URLS } from '@/lib/social-links'

/**
 * Organization schema, carrying the social accounts as `sameAs`.
 *
 * Linking to the accounts from the footer tells a visitor where to find us;
 * it tells a search engine nothing. `sameAs` is what ties the site and the
 * accounts together as one entity, so a search for the firm returns the
 * profiles alongside the site instead of competing with them.
 *
 * `url` is only emitted once NEXT_PUBLIC_SITE_URL is set. A guessed or
 * wrong canonical URL is worse than none: it points the association at a
 * domain we do not serve.
 */
const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LegaLite',
  description: 'The intelligent platform for modern legal practice in Ghana.',
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { url: process.env.NEXT_PUBLIC_SITE_URL }
    : {}),
  sameAs: SOCIAL_PROFILE_URLS,
}

export const metadata: Metadata = {
  title: 'LegaLite – Smart Legal Practice, Research & Case Management',
  description:
    'LegaLite simplifies legal practice management with AI driven case tracking, billing automation, document insights, and fast legal research, all in one platform.',
  openGraph: {
    title: 'LegaLite – Smart Legal Practice, Research & Case Management',
    description:
      'LegaLite simplifies legal practice management with AI driven case tracking, billing automation, document insights, and fast legal research, all in one platform.',
    type: 'website',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#F8F4EE] text-[#0D1B2A] antialiased min-h-screen [font-family:Inter,Arial,sans-serif]">
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600;7..72,700&display=swap"
        rel="stylesheet"
      />
      <script
        type="application/ld+json"
        // Static object built above, not user input, so there is nothing to
        // escape beyond the closing-tag sequence JSON.stringify leaves intact.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ORGANIZATION_SCHEMA).replace(/</g, '\\u003c'),
        }}
      />
      <MarketingNav />
      <main className="overflow-x-clip">{children}</main>
      <MarketingFooter />
    </div>
  )
}
