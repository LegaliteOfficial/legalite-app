import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

export const metadata: Metadata = {
  title: 'LegaLite – Smart Legal Practice, Research & Case Management',
  description:
    'LegaLite simplifies legal practice management with AI-driven case tracking, billing automation, document insights, and fast legal research—all in one platform.',
  openGraph: {
    title: 'LegaLite – Smart Legal Practice, Research & Case Management',
    description:
      'LegaLite simplifies legal practice management with AI-driven case tracking, billing automation, document insights, and fast legal research—all in one platform.',
    type: 'website',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#0A1622] text-white antialiased min-h-screen [font-family:Inter,Arial,sans-serif]">
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600;7..72,700&display=swap"
        rel="stylesheet"
      />
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}
