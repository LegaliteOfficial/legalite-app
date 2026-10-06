import type { Metadata } from 'next'
import { getLawNews, timeAgo, type NewsArticle } from '@/lib/news'
import { NewsImage } from '@/components/marketing/news-image'
import { SectionMark } from '@/components/marketing/section-mark'
import { mk } from '@/lib/marketing-theme'

export const metadata: Metadata = {
  title: 'News',
}

// Regenerate the page at most every 30 minutes to stay within the free quota.
export const revalidate = 1800


const TABS = ['Top', 'Local', 'International', 'Courts', 'Legislation']

// Fallback feed shown only when no NEWSDATA_API_KEY is configured.
const SAMPLE: NewsArticle[] = [
  { id: 's1', region: 'Local', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Parliament opens debate on amendments to the Data Protection Act', description: 'Lawmakers began reviewing proposed changes that would tighten rules on cross border data transfers and expand the powers of the Data Protection Commission.' },
  { id: 's2', region: 'Local', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Supreme Court sets a new hearing calendar for the commercial division', description: null },
  { id: 's3', region: 'International', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Regional court delivers judgment in a cross border trade dispute', description: null },
  { id: 's4', region: 'Local', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Bar Association proposes updates to the rules of legal practice', description: null },
  { id: 's5', region: 'International', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Tribunal issues fresh guidance on the handling of digital evidence', description: null },
  { id: 's6', region: 'Local', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Electronic Transactions Bill reaches its second reading in Parliament', description: null },
  { id: 's7', region: 'Local', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'High Court clarifies the standard for interlocutory injunctions in land matters', description: null },
  { id: 's8', region: 'International', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Committee reviews a draft framework for artificial intelligence in the public sector', description: null },
  { id: 's9', region: 'International', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Cross border insolvency treaty gains three new signatories', description: null },
  { id: 's10', region: 'Local', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Registrar General announces a faster process for company filings', description: null },
  { id: 's11', region: 'Local', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Court of Appeal restates the rules on the admissibility of expert testimony', description: null },
  { id: 's12', region: 'International', source: 'Sample', sourceUrl: null, link: '#', image: null, pubDate: null, title: 'Public consultation opens on reforms to the arbitration regime', description: null },
]


function articleProps(a: NewsArticle) {
  const external = a.link !== '#'
  return {
    href: a.link,
    target: external ? '_blank' : undefined,
    rel: external ? 'noopener noreferrer' : undefined,
  }
}

export default async function NewsPage() {
  const live = await getLawNews()
  const isPreview = live.length < 6
  const articles = isPreview ? SAMPLE : live

  const featured = articles.find((a) => a.image) || articles[0]
  const rest = articles.filter((a) => a.id !== featured.id)
  const latest = rest.slice(0, 5)
  const more = rest.slice(5, 11)

  return (
    <section className="px-6 lg:px-12 pt-12 pb-20 lg:pt-16 lg:pb-28">
      <div className={mk.container}>
        {/* Header */}
        <SectionMark>News</SectionMark>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <h1 className={`${mk.h1} max-w-3xl lg:text-6xl`}>
            Law news, from Accra to the world
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {['Ghana', 'English'].map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-lg border border-[#0D1B2A]/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#0D1B2A]/70"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {isPreview && (
          <p className="mt-6 text-xs text-[#0D1B2A]/45">
            Preview feed with sample stories. Live law news appears once the news API key is
            configured.
          </p>
        )}

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-1 border-b border-[#0D1B2A]/10">
          {TABS.map((t, i) => (
            <span
              key={t}
              className={`relative px-4 py-3 text-sm ${i === 0 ? 'font-semibold text-[#0D1B2A]' : 'text-[#0D1B2A]/50'}`}
            >
              {t}
              {i === 0 && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#C9972B]" />
              )}
            </span>
          ))}
        </div>

        {/* Featured + Latest */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.7fr_1fr]">
          <article>
            <a
              {...articleProps(featured)}
              className="group block overflow-hidden rounded-2xl bg-[#E9E1D3] shadow-[0_30px_60px_-34px_rgba(13,27,42,0.45)]"
            >
              <div className="relative aspect-[16/9]">
                <NewsImage src={featured.image} seed={featured.id} />
                <span className="absolute left-4 top-4 rounded-full bg-[#C9972B] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0D1B2A]">
                  {featured.region}
                </span>
              </div>
            </a>

            <div className="mt-6 flex items-center gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wide text-[#A67A1C]">
                {featured.source}
              </span>
              {timeAgo(featured.pubDate) && (
                <span className="text-[#0D1B2A]/40">· {timeAgo(featured.pubDate)}</span>
              )}
            </div>

            <a {...articleProps(featured)} className="group block">
              <h2 className="mt-3 text-2xl md:text-4xl [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-tight text-[#0D1B2A] transition group-hover:text-[#A67A1C]">
                {featured.title}
              </h2>
            </a>
            {featured.description && (
              <p className="mt-4 text-base text-[#0D1B2A]/65 leading-relaxed max-w-2xl">
                {featured.description}
              </p>
            )}
            {featured.link !== '#' && (
              <a
                {...articleProps(featured)}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#A67A1C]"
              >
                Read the full story at {featured.source}
                <span aria-hidden>&rarr;</span>
              </a>
            )}
          </article>

          {/* Latest list */}
          <aside>
            <div className="text-xs font-semibold uppercase tracking-[2.5px] text-[#A67A1C]">Latest</div>
            <div className="mt-5 divide-y divide-[#0D1B2A]/10 border-t border-[#0D1B2A]/10">
              {latest.map((a) => (
                <a key={a.id} {...articleProps(a)} className="group block py-5">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-semibold text-[#A67A1C]">{a.source}</span>
                    {timeAgo(a.pubDate) && <span className="text-[#0D1B2A]/40">· {timeAgo(a.pubDate)}</span>}
                  </div>
                  <p className="mt-2 text-[15px] font-medium text-[#0D1B2A]/85 leading-snug transition group-hover:text-[#A67A1C]">
                    {a.title}
                  </p>
                </a>
              ))}
            </div>
          </aside>
        </div>

        {/* More stories */}
        {more.length > 0 && (
          <div className="mt-20">
            <div className="text-xs font-semibold uppercase tracking-[2.5px] text-[#A67A1C]">More stories</div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {more.map((a) => (
                <a
                  key={a.id}
                  {...articleProps(a)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#0D1B2A]/[0.08] bg-white transition hover:border-[#C9972B]/50 hover:shadow-[0_24px_50px_-30px_rgba(13,27,42,0.45)]"
                >
                  <div className="relative aspect-[16/10]">
                    <NewsImage src={a.image} seed={a.id} />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="rounded-md bg-[#C9972B]/15 px-2 py-0.5 font-semibold text-[#A67A1C]">
                        {a.region}
                      </span>
                      <span className="text-[#0D1B2A]/55">{a.source}</span>
                      {timeAgo(a.pubDate) && <span className="text-[#0D1B2A]/40">· {timeAgo(a.pubDate)}</span>}
                    </div>
                    <p className="mt-3 text-base font-medium text-[#0D1B2A]/85 leading-snug transition group-hover:text-[#A67A1C]">
                      {a.title}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
