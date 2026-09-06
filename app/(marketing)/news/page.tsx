import type { Metadata } from 'next'
import { getLawNews, timeAgo, type NewsArticle } from '@/lib/news'

export const metadata: Metadata = {
  title: 'News',
}

// Regenerate the page at most every 30 minutes to stay within the free quota.
export const revalidate = 1800

const sectionClass = 'px-6 lg:px-12'
const containerClass = 'mx-auto max-w-[1600px]'
const eyebrowClass = 'text-[#E8B84B] text-[0.6rem] tracking-[5px] uppercase'
const dividerClass = 'h-px bg-white/10 mt-3 mb-6'

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

function ImagePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        background:
          'radial-gradient(120% 100% at 20% 0%, rgba(201,151,43,0.22), transparent 55%), radial-gradient(120% 120% at 90% 100%, rgba(20,38,60,0.6), transparent 55%), #2A3544',
      }}
      aria-hidden
    />
  )
}

function ArticleImage({ src }: { src: string | null }) {
  if (!src) return <ImagePlaceholder className="absolute inset-0" />
  // Plain img for arbitrary external news domains (avoids next/image host allowlist).
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}

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
    <section className={`${sectionClass} pt-24 pb-32 relative`}>
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9972B]/40 to-transparent"
        aria-hidden
      />
      <div className={containerClass}>
        {/* Header */}
        <div className={eyebrowClass}>News</div>
        <div className={dividerClass} />

        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <h1 className="text-4xl md:text-6xl [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-[-1px] leading-[1.02] text-white max-w-3xl">
            Law news, from Accra to the world
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {['Ghana', 'English'].map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/70"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {isPreview && (
          <p className="mt-6 text-xs text-white/35">
            Preview feed with sample stories. Live law news appears once the news API key is
            configured.
          </p>
        )}

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-1 border-b border-white/10">
          {TABS.map((t, i) => (
            <span
              key={t}
              className={`relative px-4 py-3 text-sm ${i === 0 ? 'text-white' : 'text-white/45'}`}
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
              className="group block overflow-hidden rounded-2xl border border-white/10"
            >
              <div className="relative aspect-[16/9]">
                <ArticleImage src={featured.image} />
                <span className="absolute left-4 top-4 rounded-full bg-[#C9972B] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2A3544]">
                  {featured.region}
                </span>
              </div>
            </a>

            <div className="mt-6 flex items-center gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wide text-[#E8B84B]">
                {featured.source}
              </span>
              {timeAgo(featured.pubDate) && (
                <span className="text-white/30">· {timeAgo(featured.pubDate)}</span>
              )}
            </div>

            <a {...articleProps(featured)} className="group block">
              <h2 className="mt-3 text-2xl md:text-4xl [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-tight text-white transition group-hover:text-white/80">
                {featured.title}
              </h2>
            </a>
            {featured.description && (
              <p className="mt-4 text-base text-white/55 leading-relaxed max-w-2xl">
                {featured.description}
              </p>
            )}
            {featured.link !== '#' && (
              <a
                {...articleProps(featured)}
                className="mt-6 inline-flex items-center gap-2 text-sm text-[#E8B84B]"
              >
                Read the full story at {featured.source}
                <span aria-hidden>&rarr;</span>
              </a>
            )}
          </article>

          {/* Latest list */}
          <aside>
            <div className="text-[10px] uppercase tracking-[3px] text-white/40">Latest</div>
            <div className="mt-5 divide-y divide-white/10 border-t border-white/10">
              {latest.map((a) => (
                <a key={a.id} {...articleProps(a)} className="group block py-5">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#E8B84B]">{a.source}</span>
                    {timeAgo(a.pubDate) && <span className="text-white/30">· {timeAgo(a.pubDate)}</span>}
                  </div>
                  <p className="mt-2 text-[15px] text-white/80 leading-snug transition group-hover:text-white">
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
            <div className="text-[10px] uppercase tracking-[3px] text-white/40">More stories</div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {more.map((a) => (
                <a
                  key={a.id}
                  {...articleProps(a)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#2A3544] transition hover:border-[#C9972B]/30"
                >
                  <div className="relative aspect-[16/10]">
                    <ArticleImage src={a.image} />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="rounded-full border border-[#C9972B]/25 bg-[#C9972B]/[0.08] px-2 py-0.5 text-[#E8B84B]">
                        {a.region}
                      </span>
                      <span className="text-white/30">{a.source}</span>
                      {timeAgo(a.pubDate) && <span className="text-white/25">· {timeAgo(a.pubDate)}</span>}
                    </div>
                    <p className="mt-3 text-base text-white/80 leading-snug transition group-hover:text-white">
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
