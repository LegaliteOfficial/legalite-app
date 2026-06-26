'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FIRM_TYPES,
  GHANA_REGIONS,
} from '../_constants'
import type { DraftField, FirmSettingsDraft } from '../_types'
import { Field, NativeSelect } from './primitives/Field'
import { BrandColorPicker } from './primitives/BrandColorPicker'
import { LogoUpload } from './primitives/LogoUpload'

type SetField = <K extends DraftField>(
  key: K,
  value: FirmSettingsDraft[K],
) => void

const regionOptions = GHANA_REGIONS.map((r) => ({ value: r, label: r }))

export function FirmSettingsForm({
  draft,
  setField,
}: {
  draft: FirmSettingsDraft
  setField: SetField
}) {
  return (
    <div className="space-y-6">
      {/* Identity & branding */}
      <SectionCard
        title="Identity & branding"
        subtitle="How the firm is named and presented across the app."
      >
        <div className="space-y-5">
          <Field label="Logo">
            <LogoUpload
              value={draft.logoDataUrl}
              onChange={(v) => setField('logoDataUrl', v)}
            />
          </Field>

          <Field
            label="Brand colour"
            hint="Used for the sidebar chip when no logo is set."
          >
            <BrandColorPicker
              value={draft.brandColor}
              onChange={(v) => setField('brandColor', v)}
              firmName={draft.name}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Firm name" htmlFor="firm-name" required>
              <Input
                id="firm-name"
                value={draft.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Mensah & Associates"
              />
            </Field>
            <Field label="Firm type" htmlFor="firm-type">
              <NativeSelect
                id="firm-type"
                value={draft.firm_type}
                onChange={(v) => setField('firm_type', v)}
                options={FIRM_TYPES}
              />
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="firm-desc"
            hint="A short blurb shown on the client portal and letterhead."
          >
            <Textarea
              id="firm-desc"
              value={draft.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="What the firm does, in a sentence or two."
              rows={3}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Registration & compliance */}
      <SectionCard
        title="Registration & compliance"
        subtitle="Statutory identifiers carried onto invoices and filings."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            label="Registration number"
            htmlFor="firm-reg"
            hint="Registrar-General’s Department."
          >
            <Input
              id="firm-reg"
              value={draft.registration_number}
              onChange={(e) => setField('registration_number', e.target.value)}
              placeholder="CG-0123456789"
            />
          </Field>
          <Field label="TIN" htmlFor="firm-tin" hint="Ghana Revenue Authority.">
            <Input
              id="firm-tin"
              value={draft.tin}
              onChange={(e) => setField('tin', e.target.value)}
              placeholder="C0001234567"
            />
          </Field>
          <Field label="Year established" htmlFor="firm-year">
            <Input
              id="firm-year"
              inputMode="numeric"
              value={draft.year_established}
              onChange={(e) =>
                setField(
                  'year_established',
                  e.target.value.replace(/[^\d]/g, '').slice(0, 4),
                )
              }
              placeholder="2014"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Contact */}
      <SectionCard
        title="Contact"
        subtitle="Where clients and counterparties reach the firm."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Email" htmlFor="firm-email">
            <Input
              id="firm-email"
              type="email"
              value={draft.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="info@firm.com.gh"
            />
          </Field>
          <Field label="Phone" htmlFor="firm-phone">
            <Input
              id="firm-phone"
              value={draft.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+233 30 222 1234"
            />
          </Field>
          <Field label="Website" htmlFor="firm-web">
            <Input
              id="firm-web"
              value={draft.website}
              onChange={(e) => setField('website', e.target.value)}
              placeholder="https://www.firm.com.gh"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Office & jurisdiction */}
      <SectionCard
        title="Office & jurisdiction"
        subtitle="The firm’s registered office and default matter jurisdiction."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Office address" htmlFor="firm-addr">
              <Input
                id="firm-addr"
                value={draft.office_address}
                onChange={(e) => setField('office_address', e.target.value)}
                placeholder="12 Liberation Road, Ridge"
              />
            </Field>
            <Field
              label="Digital address"
              htmlFor="firm-gps"
              hint="GhanaPost GPS, e.g. GA-143-9080."
            >
              <Input
                id="firm-gps"
                value={draft.digital_address}
                onChange={(e) => setField('digital_address', e.target.value)}
                placeholder="GA-143-9080"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="City" htmlFor="firm-city">
              <Input
                id="firm-city"
                value={draft.city}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="Accra"
              />
            </Field>
            <Field label="Region" htmlFor="firm-region">
              <NativeSelect
                id="firm-region"
                value={draft.region}
                onChange={(v) => setField('region', v)}
                options={regionOptions}
              />
            </Field>
            <Field
              label="Default jurisdiction"
              htmlFor="firm-jur"
              hint="Applied to new matters."
            >
              <NativeSelect
                id="firm-jur"
                value={draft.default_jurisdiction}
                onChange={(v) => setField('default_jurisdiction', v)}
                options={regionOptions}
              />
            </Field>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

/** White card with a titled header — one per form section. */
function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2
          className="font-heading text-base font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}
