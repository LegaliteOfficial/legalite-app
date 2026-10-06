/**
 * GET /api/news-image?url=<encoded image url>
 * ------------------------------------------
 * Streams a news article image through our own origin.
 *
 * News images come from whatever host the publisher uses, and several of
 * them break when loaded directly from the browser:
 *
 *  - hotlink protection answers a cross origin request with a 403 HTML
 *    page, which the browser then blocks (ERR_BLOCKED_BY_ORB) and renders
 *    as a broken image icon
 *  - some hosts only serve images when a Referer is present
 *  - next/image cannot be used because the hosts are not known in advance
 *
 * Fetching server side sidesteps all three: we can send a normal browser
 * User-Agent and a Referer, and the browser sees a same origin image.
 *
 * Anything that is not an image comes back as 502 so the caller can show a
 * placeholder rather than a broken icon.
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Cache a successful image at the edge for a day; news images do not change.
const CACHE = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
const MAX_BYTES = 8 * 1024 * 1024
const TIMEOUT_MS = 10_000

/**
 * The route is public, so it must not be usable as a general purpose proxy
 * into the private network. Allow only http(s) to public hosts.
 */
function isPubliclyRoutable(raw: string): URL | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return null

  // Literal IPs: reject loopback, link local, and the private ranges.
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if (a === 127 || a === 10 || a === 0) return null
    if (a === 169 && b === 254) return null
    if (a === 192 && b === 168) return null
    if (a === 172 && b >= 16 && b <= 31) return null
  }
  if (host === '::1' || host.startsWith('[')) return null

  return url
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('url')
  if (!raw) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const target = isPubliclyRoutable(raw)
  if (!target) {
    return NextResponse.json({ error: 'Unsupported url' }, { status: 400 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const upstream = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Several publishers serve images only to what looks like a browser
        // arriving from their own site.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: target.origin + '/',
      },
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
    }

    // A hotlink block typically answers 200 or 403 with an HTML page. Only
    // pass through something that is actually an image.
    const type = upstream.headers.get('content-type') ?? ''
    if (!type.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 502 })
    }

    const length = Number(upstream.headers.get('content-length') ?? 0)
    if (length > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 502 })
    }

    const body = await upstream.arrayBuffer()
    if (body.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 502 })
    }

    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': type, 'Cache-Control': CACHE },
    })
  } catch {
    // Timeout, DNS failure, refused connection: the caller shows a placeholder.
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}
