import DOMPurify from 'dompurify'

/**
 * Cleans HTML before it is rendered with dangerouslySetInnerHTML or written
 * to innerHTML. Stored documents, templates filled with client data and
 * letterheads all come from the database, so a record saved through the API
 * with a script or an event handler would otherwise run in a colleague's
 * browser with their session.
 *
 * Keeps ordinary document formatting (headings, lists, tables, inline
 * styles, images) and drops scripts, frames, forms, event handlers and
 * javascript: URLs.
 */
const FORBID_TAGS = ['script', 'iframe', 'frame', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'base', 'meta', 'link']

let hooked = false

function ensureHooks() {
  if (hooked) return
  hooked = true
  // Links opened in a new tab must not get a handle on this window.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!node.hasAttribute('target')) return
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer')
    } else {
      node.removeAttribute('target')
    }
  })
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''
  // DOMPurify needs a DOM. These views render only in the browser (after
  // auth and data load), so the server pass renders nothing rather than
  // unsanitised markup.
  if (typeof window === 'undefined' || !DOMPurify.isSupported) return ''
  ensureHooks()
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS,
    ADD_ATTR: ['target'],
    ALLOW_DATA_ATTR: false,
  })
}

/** Plain text of an HTML string, without ever attaching or loading it. */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return ''
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '')
  // DOMParser documents are inert: no scripts run and no images load.
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}
