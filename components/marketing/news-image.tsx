'use client'

/**
 * Article image for the news page.
 *
 * Loads through /api/news-image so publisher hotlink protection and the
 * browser's opaque response blocking cannot turn a card into a broken image
 * icon. If the proxy still cannot produce an image, this falls back to the
 * same gradient placeholder used for articles that have no image at all, so
 * a failure is indistinguishable from a story that simply had no photo:
 * both show a stand in photo from the marketing library.
 */

import { useState } from 'react'

// Stand in photography for stories that arrive without an image, so a card
// never shows an empty panel. Picked by a stable hash of the story id so the
// same story always gets the same photo.
const FALLBACK_PHOTOS = [
  '/marketing/photos/law-library.jpg',
  '/marketing/photos/independence-arch.jpg',
  '/marketing/photos/signing-documents.jpg',
  '/marketing/photos/accra-aerial.jpg',
  '/marketing/photos/partner-meeting.jpg',
  '/marketing/photos/lawyer-reviewing-file.jpg',
]

function fallbackFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return FALLBACK_PHOTOS[hash % FALLBACK_PHOTOS.length]
}

export function NewsImage({ src, seed }: { src: string | null; seed: string }) {
  const [failed, setFailed] = useState(false)

  const url = !src || failed ? fallbackFor(seed) : `/api/news-image?url=${encodeURIComponent(src)}`

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}
