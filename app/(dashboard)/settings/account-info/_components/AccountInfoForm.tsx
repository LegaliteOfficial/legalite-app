'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { UploadSimple, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFirmStore } from '@/stores/firm.store'
import {
  COUNTRY_OPTIONS,
  DATE_FORMATS,
  DEFAULT_FORM,
  NUMBER_FORMATS,
  TIME_FORMATS,
} from '../_constants'
import { BrandColorPicker } from './BrandColorPicker'
import { FieldLabel } from './primitives/FieldLabel'
import { Section } from './primitives/Section'
import { SectionDivider } from './primitives/SectionDivider'
import { SelectNative } from './primitives/SelectNative'

export function AccountInfoForm() {
  // Branding store backs the sidebar wordmark + logo + colour chip.
  // Read each piece once so we can pre-fill the form from persisted
  // values, and so Save can write back through `setBranding`.
  const persistedFirmName = useFirmStore((s) => s.firmName)
  const persistedFirmLogo = useFirmStore((s) => s.firmLogoDataUrl)
  const persistedBrandColor = useFirmStore((s) => s.firmBrandColor)
  const setBranding = useFirmStore((s) => s.setBranding)

  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    firmName: persistedFirmName ?? '',
  }))
  // Track both the filename (for the chooser UI) and the data URL
  // (for actual upload + sidebar render). Initialised from the
  // store so reopening the page shows the currently-active logo.
  const [logoName, setLogoName] = useState<string | null>(
    persistedFirmLogo ? 'firm-logo.png' : null,
  )
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(
    persistedFirmLogo,
  )
  // Brand colour state — separate from the logo so users can swap
  // between the two as they decide. `null` means no colour picked;
  // the sidebar shows just the wordmark.
  const [brandColor, setBrandColor] = useState<string | null>(
    persistedBrandColor,
  )
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Re-sync local state if the store changes from elsewhere (e.g.
  // a logout + login as a different user). Cheap — runs at most
  // once per branding write.
  useEffect(() => {
    setForm((f) => ({ ...f, firmName: persistedFirmName ?? f.firmName }))
    setLogoDataUrl(persistedFirmLogo)
    if (!persistedFirmLogo) setLogoName(null)
    setBrandColor(persistedBrandColor)
  }, [persistedFirmName, persistedFirmLogo, persistedBrandColor])

  const setField = <K extends keyof typeof DEFAULT_FORM>(key: K, value: (typeof DEFAULT_FORM)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  /**
   * Read the picked file as a base64 data URL so it can be both
   * previewed (Image src) and persisted (localStorage). 2 MB cap
   * matches the copy under the upload control; anything bigger is
   * rejected with a toast.
   */
  const handlePickFile = (file: File) => {
    const MAX_BYTES = 2 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      toast.error('Logo is larger than 2 MB. Pick a smaller file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null
      if (!url) {
        toast.error("Couldn't read that file. Try a different format.")
        return
      }
      setLogoName(file.name)
      setLogoDataUrl(url)
    }
    reader.onerror = () =>
      toast.error("Couldn't read that file. Try a different format.")
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!form.firmName.trim()) {
      toast.error('Firm name is required.')
      return
    }
    if (!form.country) {
      toast.error('Country is required.')
      return
    }
    // Persist the three branding fields so the sidebar updates
    // immediately + the values survive a reload. The rest of the
    // form (address, contact, formats, LEDES ID) still has no
    // backend so it stays toast-only.
    setBranding({
      firmName: form.firmName.trim(),
      firmLogoDataUrl: logoDataUrl,
      firmBrandColor: brandColor,
    })
    toast.success('Firm details saved. The sidebar will reflect the new branding.')
  }

  const handleCancel = () => {
    setForm({
      ...DEFAULT_FORM,
      firmName: persistedFirmName ?? '',
    })
    setLogoName(persistedFirmLogo ? 'firm-logo.png' : null)
    setLogoDataUrl(persistedFirmLogo)
    setBrandColor(persistedBrandColor)
    toast.message('Changes discarded.')
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm mb-8 leading-relaxed" style={{ color: '#6B7280' }}>
        This information will be reflected on client bills and in the LegaLite client portal.
        Only firm administrators are able to modify account information.
      </p>

      {/* Firm Logo */}
      <Section title="Firm Logo">
        <div className="flex items-stretch gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handlePickFile(file)
            }}
          />
          {/* Live preview of the picked / persisted logo. Square
              chip mirrors the sidebar's render so users can see
              what the wordmark will look like before saving. */}
          {logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoDataUrl}
              alt="Firm logo preview"
              className="h-10 w-10 rounded-md object-contain border shrink-0"
              style={{ borderColor: 'var(--border)', background: 'white' }}
            />
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-md border h-10 px-3 text-sm text-left transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: 'var(--border)', background: 'white', color: logoName ? 'var(--navy)' : '#9CA3AF' }}
          >
            {logoName ?? 'Choose file...'}
          </button>
          {logoName && (
            <button
              type="button"
              onClick={() => {
                setLogoName(null)
                setLogoDataUrl(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="rounded-md border h-10 px-3 hover:bg-black/[0.02] transition-colors"
              style={{ borderColor: 'var(--border)', color: '#6B7280' }}
              aria-label="Remove selected file"
            >
              <X size={14} strokeWidth={2.25} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!logoDataUrl) {
                toast.error('Select a file first.')
                return
              }
              // Apply the logo to the live branding immediately —
              // no need to wait for the full Save Changes button.
              // The sidebar picks up the new image on the next
              // render tick.
              setBranding({ firmLogoDataUrl: logoDataUrl })
              toast.success(`Logo "${logoName}" applied to the sidebar.`)
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 h-10 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--navy)' }}
          >
            <UploadSimple size={14} strokeWidth={2.25} /> Upload Logo
          </button>
        </div>
        <p className="text-xs mt-2 leading-relaxed" style={{ color: '#9CA3AF' }}>
          Accepted logo formats are JPEG, PNG or GIF. Logos should not exceed 2MB in size.
          Ideal logo dimensions are 5.5 : 1.0, however the system will attempt to appropriately size the image to fit according to bill dimensions.
        </p>
      </Section>

      {/* Brand Colour */}
      {/* For firms that don't want to upload a logo (or haven't
          designed one yet) — pick a colour and the sidebar shows a
          coloured chip with the firm's initials in place of a logo
          image. Logo wins if both are set; clearing the logo falls
          back to the colour chip. */}
      <Section title="Brand Colour">
        <BrandColorPicker
          value={brandColor}
          onChange={(c) => setBrandColor(c)}
          firmName={form.firmName || 'LegaLite'}
        />
        <p className="text-xs mt-2 leading-relaxed" style={{ color: '#9CA3AF' }}>
          Used in place of a logo when none is uploaded. The sidebar
          chip will show your firm's initials on this colour.
        </p>
      </Section>

      {/* Firm Name */}
      <Section title="Firm Name">
        <Input
          value={form.firmName}
          onChange={(e) => setField('firmName', e.target.value)}
          placeholder="e.g. Mensah & Associates"
          className="h-10"
        />
        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
          By editing the firm name, this change will be reflected throughout the LegaLite app.
        </p>
      </Section>

      {/* Mailing Address (boxed card) */}
      <SectionDivider />
      <h3 className="font-heading text-base font-bold mb-3" style={{ color: 'var(--navy)' }}>Mailing Address</h3>
      <div className="rounded-xl border p-5 mb-8" style={{ borderColor: 'var(--border)', background: 'var(--cream-white)' }}>
        <div className="mb-4">
          <FieldLabel>Street</FieldLabel>
          <Input value={form.street} onChange={(e) => setField('street', e.target.value)} className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <FieldLabel>City</FieldLabel>
            <Input value={form.city} onChange={(e) => setField('city', e.target.value)} className="h-10" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel className="!mb-0">Country</FieldLabel>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--gold)' }}>required</span>
            </div>
            <div className="relative">
              <SelectNative value={form.country} onChange={(v) => setField('country', v)} options={COUNTRY_OPTIONS} />
              {form.country !== DEFAULT_FORM.country && (
                <button
                  type="button"
                  onClick={() => setField('country', DEFAULT_FORM.country)}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-xs font-semibold underline underline-offset-2"
                  style={{ color: 'var(--gold)' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>State / Province</FieldLabel>
            <Input value={form.stateProvince} onChange={(e) => setField('stateProvince', e.target.value)} className="h-10" />
          </div>
          <div>
            <FieldLabel>Post Code</FieldLabel>
            <Input value={form.postCode} onChange={(e) => setField('postCode', e.target.value)} className="h-10" />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <SectionDivider />
      <h3 className="font-heading text-base font-bold mb-3" style={{ color: 'var(--navy)' }}>Contact Information</h3>
      <div className="mb-8 space-y-4">
        <div>
          <FieldLabel>Phone</FieldLabel>
          <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+233 XX XXX XXXX" className="h-10" />
        </div>
        <div>
          <FieldLabel>Fax</FieldLabel>
          <Input value={form.fax} onChange={(e) => setField('fax', e.target.value)} className="h-10" />
        </div>
        <div>
          <FieldLabel>Client Contact Email</FieldLabel>
          <Input type="email" value={form.clientEmail} onChange={(e) => setField('clientEmail', e.target.value)} placeholder="hello@yourfirm.gh" className="h-10" />
        </div>
        <div>
          <FieldLabel>Client Contact Website</FieldLabel>
          <Input type="url" value={form.clientWebsite} onChange={(e) => setField('clientWebsite', e.target.value)} placeholder="https://yourfirm.gh" className="h-10" />
        </div>
      </div>

      {/* Format Gear */}
      <SectionDivider />
      <h3 className="font-heading text-base font-bold mb-3" style={{ color: 'var(--navy)' }}>Format Gear</h3>
      <div className="mb-8 space-y-4">
        <div>
          <FieldLabel>Date format</FieldLabel>
          <SelectNative value={form.dateFormat} onChange={(v) => setField('dateFormat', v)} options={DATE_FORMATS} fullWidth />
        </div>
        <div>
          <FieldLabel>Time format</FieldLabel>
          <SelectNative value={form.timeFormat} onChange={(v) => setField('timeFormat', v)} options={TIME_FORMATS} fullWidth />
        </div>
        <div>
          <FieldLabel>Number format</FieldLabel>
          <SelectNative value={form.numberFormat} onChange={(v) => setField('numberFormat', v)} options={NUMBER_FORMATS} fullWidth />
        </div>
      </div>

      {/* LEDES */}
      <SectionDivider />
      <h3 className="font-heading text-base font-bold mb-2" style={{ color: 'var(--navy)' }}>LEDES Law Firm ID, Tax ID or GST Number</h3>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: '#6B7280' }}>
        This information is only for inclusion on LEDES bill exports. To change your business name or tax ID as it
        relates to LegaLite Payments, update in your{' '}
        <Link href="/firm/billing" className="underline underline-offset-2 font-semibold" style={{ color: 'var(--gold)' }}>
          LegaLite Payments profile
        </Link>.
      </p>
      <Input value={form.ledesId} onChange={(e) => setField('ledesId', e.target.value)} className="h-10 mb-8" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          className="text-white font-semibold px-6 h-10"
          style={{ background: 'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)' }}
        >
          Save New Information
        </Button>
        <span className="text-sm" style={{ color: '#6B7280' }}>or</span>
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm font-semibold underline underline-offset-2"
          style={{ color: 'var(--gold)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

