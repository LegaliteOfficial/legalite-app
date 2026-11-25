/**
 * The firm record as edited on the firm settings screen. Matches the
 * backend's UpdateFirmInput. `year_established` is held as a string so the
 * input stays controlled while empty; it is coerced back to a number on save.
 * The logo and brand colour live in firm.store (shown in the sidebar).
 */
export interface FirmSettingsDraft {
  name: string
  firm_type: string
  registration_number: string
  tin: string
  year_established: string
  email: string
  phone: string
  website: string
  office_address: string
  digital_address: string
  city: string
  region: string
  description: string
  logoDataUrl: string | null
  brandColor: string | null
}

export type DraftField = keyof FirmSettingsDraft
