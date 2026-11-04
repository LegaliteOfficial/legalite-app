/**
 * The public social accounts, in one place.
 *
 * The footer and the demo-request page each carried their own copy of these
 * URLs, and both pointed at `linkedin.com/company/legalitetech`, which
 * answers 404 — so every visitor who clicked LinkedIn on the live site
 * landed on a LinkedIn error page. One list means a handle change lands
 * everywhere at once.
 *
 * URLs are stored canonical: no `/posts/` suffix and no share token
 * (`?cplk=`, `?igsh=`), both of which come attached when a handle is copied
 * out of the app or the address bar. They redirect fine, but the token is a
 * share identifier we would otherwise publish in our own markup, and the
 * suffix drops visitors on a sub-view rather than the profile.
 */

export interface SocialAccount {
  /** Accessible name, and the visible text wherever the list renders as links. */
  label: string
  href: string
  /** Monochrome white glyph on a 32x32 viewBox, sized down by the consumer. */
  icon: string
}

export const SOCIAL_ACCOUNTS: readonly SocialAccount[] = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/legalite-gh/',
    icon: '/marketing/contact/linkedin.svg',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/legaliteai/',
    icon: '/marketing/contact/instagram.svg',
  },
]

/**
 * `sameAs` for the Organization schema. This is what lets a search engine
 * treat the accounts and the site as one entity rather than three unrelated
 * results, so it has to stay in step with the list above.
 */
export const SOCIAL_PROFILE_URLS: readonly string[] = SOCIAL_ACCOUNTS.map(
  (a) => a.href,
)
