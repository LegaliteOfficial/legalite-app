/**
 * Firm branding store
 * -------------------
 * Holds the firm-level branding that overrides the default LegaLite
 * wordmark across the app:
 *
 *   - `firmName`        — the displayed firm name; when set, the
 *                         sidebar and any other branding surface
 *                         shows this instead of "LegaLite".
 *   - `firmLogoDataUrl` — base64-encoded image (data URL) of the
 *                         uploaded logo. Today this lives in
 *                         localStorage because there's no backend
 *                         file-storage layer; when the storage
 *                         service ships the field becomes a remote
 *                         URL and the persisted shape stays
 *                         compatible (it's still just a string).
 *
 * Persistence uses Zustand's `persist` middleware so the branding
 * survives page reloads and login sessions. localStorage caps
 * around 5 MB across all keys, and the Account Info form already
 * enforces a 2 MB upload limit — well within budget.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FirmStore {
  /** Firm name shown in the sidebar / bills / portal. `null` = use the LegaLite default. */
  firmName: string | null
  /** Data-URL logo (or remote URL once storage ships). `null` = no logo. */
  firmLogoDataUrl: string | null
  /**
   * Hex colour used to fill the brand chip when no logo is uploaded.
   * Firms that don't have (or don't want to upload) a logo can pick
   * a brand colour instead — the sidebar then renders a square chip
   * filled with that colour, lettered with the firm's initials.
   * Format is a CSS-parseable colour string (e.g. "#0D1B2A" or
   * "rgb(13,27,42)"). `null` = no colour set.
   */
  firmBrandColor: string | null

  setFirmName: (name: string | null) => void
  setFirmLogo: (logoDataUrl: string | null) => void
  setBrandColor: (color: string | null) => void
  /**
   * Replace any subset of the branding fields in one go. Useful for
   * the Save button in Account Info so the sidebar refresh only
   * fires once. `undefined` for a key means "leave alone"; explicit
   * `null` clears that field.
   */
  setBranding: (next: {
    firmName?: string | null
    firmLogoDataUrl?: string | null
    firmBrandColor?: string | null
  }) => void
  /** Wipe everything — used by the "Clear branding" hint in dev. */
  reset: () => void
}

export const useFirmStore = create<FirmStore>()(
  persist(
    (set) => ({
      firmName: null,
      firmLogoDataUrl: null,
      firmBrandColor: null,

      setFirmName: (firmName) => set({ firmName: firmName?.trim() || null }),
      setFirmLogo: (firmLogoDataUrl) => set({ firmLogoDataUrl }),
      setBrandColor: (firmBrandColor) => set({ firmBrandColor }),
      setBranding: ({ firmName, firmLogoDataUrl, firmBrandColor }) =>
        set((prev) => ({
          firmName:
            firmName === undefined
              ? prev.firmName
              : firmName?.trim() || null,
          firmLogoDataUrl:
            firmLogoDataUrl === undefined
              ? prev.firmLogoDataUrl
              : firmLogoDataUrl,
          firmBrandColor:
            firmBrandColor === undefined
              ? prev.firmBrandColor
              : firmBrandColor,
        })),
      reset: () =>
        set({
          firmName: null,
          firmLogoDataUrl: null,
          firmBrandColor: null,
        }),
    }),
    {
      name: 'll:firm-branding',
      // Only persist data fields — the setters are re-derived each
      // render from the store factory, no need to round-trip them.
      partialize: (state) => ({
        firmName: state.firmName,
        firmLogoDataUrl: state.firmLogoDataUrl,
        firmBrandColor: state.firmBrandColor,
      }),
    },
  ),
)
