import type { FirmProfile } from '@/stores/firm-profile-local.store'

/**
 * The editable form draft = the firm profile plus the two branding
 * fields that live in firm.store (logo + colour). `year_established`
 * is held as a string in the draft so the input stays controlled
 * while empty; it's coerced back to a number on save.
 */
export type FirmSettingsDraft = Omit<FirmProfile, 'year_established'> & {
  year_established: string
  logoDataUrl: string | null
  brandColor: string | null
}

export type DraftField = keyof FirmSettingsDraft
