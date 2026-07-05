import type { CSSProperties } from 'react'

/**
 * The app-shell background — the darkened law-firm photo behind the
 * whole authenticated app. The desktop sidebar is transparent and lets
 * this show through; the mobile nav drawer reuses the same style so the
 * two read identically. Single source of truth to prevent drift.
 */
export const APP_BACKGROUND: CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(13,27,42,0.18), rgba(13,27,42,0.18)), url('/assets/images/law%20firm.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}
