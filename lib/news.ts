/**
 * Law news fetching via NewsData.io (free tier, commercial use allowed).
 *
 * Runs server-side only so NEWSDATA_API_KEY is never exposed to the browser.
 * Results are cached (revalidated) to stay well within the 200 credits/day
 * free quota. When no key is configured, getLawNews returns an empty array and
 * the News page falls back to its sample feed.
 *
 * Docs: https://newsdata.io/documentation
 */

const ENDPOINT = 'https://newsdata.io/api/1/latest'
// Title-only legal terms for precision (kept under NewsData's 100 char limit).
// "judge" is intentionally excluded because it matches names like "Aaron Judge".
const LAW_QUERY = 'court OR judiciary OR lawsuit OR ruling OR legislation OR verdict OR tribunal'
const REVALIDATE_SECONDS = 1800 // 30 minutes

export type Region = 'Local' | 'International'

export interface NewsArticle {
  id: string
  title: string
  link: string
  description: string | null
  image: string | null
  source: string
  sourceUrl: string | null
  pubDate: string | null
  region: Region
}

interface RawArticle {
  article_id?: string
  title?: string
  link?: string
  description?: string
  image_url?: string | null
  source_id?: string
  source_name?: string
  source_url?: string
  pubDate?: string
}

function mapArticle(a: RawArticle, region: Region): NewsArticle {
  return {
    id: a.article_id || a.link || a.title || '',
    title: a.title || 'Untitled',
    link: a.link || '#',
    description: a.description || null,
    image: a.image_url || null,
    source: a.source_name || a.source_id || 'Source',
    sourceUrl: a.source_url || null,
    pubDate: a.pubDate || null,
    region,
  }
}

async function fetchFeed(query: string, region: Region): Promise<NewsArticle[]> {
  const key = process.env.NEWSDATA_API_KEY
  if (!key) return []
  const url = `${ENDPOINT}?${query}&apikey=${key}`
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: RawArticle[] }
    return (data.results || []).filter((a) => a.title).map((a) => mapArticle(a, region))
  } catch {
    return []
  }
}

/** Fetch Ghanaian and international law news, deduped and sorted newest first. */
export async function getLawNews(): Promise<NewsArticle[]> {
  const q = encodeURIComponent(LAW_QUERY)
  const exclude = 'excludecategory=sports,entertainment'
  const [local, international] = await Promise.all([
    fetchFeed(`qInTitle=${q}&country=gh&language=en&${exclude}`, 'Local'),
    fetchFeed(`qInTitle=${q}&language=en&${exclude}`, 'International'),
  ])

  const byDate = (a: NewsArticle, b: NewsArticle) =>
    (b.pubDate || '').localeCompare(a.pubDate || '')
  local.sort(byDate)
  international.sort(byDate)

  // Lead with Ghana law news, then international, deduped by title.
  const seen = new Set<string>()
  return [...local, ...international].filter((a) => {
    const k = a.title.toLowerCase().trim()
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** Human friendly relative time from a NewsData pubDate ("2026-08-30 12:00:00" UTC). */
export function timeAgo(pubDate: string | null): string {
  if (!pubDate) return ''
  const then = new Date(pubDate.replace(' ', 'T') + 'Z').getTime()
  if (Number.isNaN(then)) return ''
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
