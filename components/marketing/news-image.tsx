'use client'

/**
 * Article image for the news page.
 *
 * Loads through /api/news-image so publisher hotlink protection and the
 * browser's opaque response blocking cannot turn a card into a broken image
 * icon. If the proxy still cannot produce an image, this falls back to the
 * same gradient placeholder used for articles that have no image at all, so
 * a failure is indistinguishable from a story that simply had no photo.
 */

import { useState } from 'react'

export function NewsImagePlaceholder({ className = '' }: { className?: string }) {
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

export function NewsImage({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <NewsImagePlaceholder className="absolute inset-0" />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/news-image?url=${encodeURIComponent(src)}`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}
