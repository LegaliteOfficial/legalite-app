'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { CaretRight, UploadSimple, X, Check, Warning, Crown, CreditCard, CalendarBlank, Users as UsersIcon, ArrowsLeftRight, Shield, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useFirmStore } from '@/stores/firm.store'

type TabId = 'account' | 'payment' | 'admin'

const TABS = [
  { id: 'account', label: 'Account Info' },
  { id: 'payment', label: 'Payment Info' },
  { id: 'admin',   label: 'Account Administration' },
] as const

const COUNTRY_OPTIONS = [
  { value: 'GH', label: 'Ghana' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'CI', label: "Côte d'Ivoire" },
  { value: 'TG', label: 'Togo' },
  { value: 'BJ', label: 'Benin' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'SN', label: 'Senegal' },
  { value: 'KE', label: 'Kenya' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
]

const DATE_FORMATS = [
  { value: 'mdy_slash', label: '12/31/2026' },
  { value: 'dmy_slash', label: '31/12/2026' },
  { value: 'ymd_dash',  label: '2026-12-31' },
  { value: 'long',      label: '31 December 2026' },
]

const TIME_FORMATS = [
  { value: '12h', label: '11:59 PM' },
  { value: '24h', label: '23:59' },
]

const NUMBER_FORMATS = [
  { value: 'ghs_comma', label: 'GHS x,xxx.xx' },
  { value: 'usd_comma', label: '$x,xxx.xx' },
  { value: 'eur_dot',   label: '€x.xxx,xx' },
]

const DEFAULT_FORM = {
  firmName: '',
  street: '',
  city: '',
  country: 'GH',
  stateProvince: '',
  postCode: '',
  phone: '',
  fax: '',
  clientEmail: '',
  clientWebsite: '',
  dateFormat: 'dmy_slash',
  timeFormat: '24h',
  numberFormat: 'ghs_comma',
  ledesId: '',
}

export default function AccountInfoPage() {
  const [activeTab, setActiveTab] = useState<TabId>('account')

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--surface-card)' }}>
      <div className="flex items-center gap-2 text-sm mb-5" style={{ color: 'var(--navy)' }}>
        <Link href="/settings" className="hover:opacity-70 transition-opacity" style={{ color: '#6B7280' }}>Gear</Link>
        <CaretRight size={14} strokeWidth={2.25} style={{ color: '#9CA3AF' }} />
        <span className="font-bold">Account and Payment Info</span>
      </div>

      {/* Tabs + Close Account */}
      <div className="flex items-end justify-between border-b mb-8" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-6">
          {TABS.map((t) => {
            const active = t.id === activeTab
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className="relative pb-3 text-sm font-semibold transition-colors"
                style={{ color: active ? 'var(--navy)' : '#6B7280' }}
              >
                {t.label}
                {active && (
                  <span
                    className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                    style={{ background: 'var(--gold)' }}
                  />
                )}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => toast.error('Close Account is disabled in this build. Real implementation will require multi-step confirmation.')}
          className="mb-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold border transition-colors hover:bg-red-50"
          style={{ borderColor: '#FCA5A5', color: '#B91C1C' }}
        >
          Close Account
        </button>
      </div>

      {activeTab === 'account' && <AccountInfoForm />}
      {activeTab === 'payment' && <PaymentInfoTab />}
      {activeTab === 'admin'   && <AccountAdministrationTab />}
    </div>
  )
}

function AccountInfoForm() {
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

// ── Payment Info tab — plan chooser ────────────────────────────────────────

type BillingPeriod = 'monthly' | 'annual'
type PlanId = 'standard' | 'premium' | 'suite'

type Plan = {
  id: PlanId
  name: string
  monthly: number | null  // null = custom pricing (Suite)
  annual: number | null
  tagline: string
  features: string[]
}

// Ghana market pricing — placeholder values. Adjust when real plan model lands.
const PLANS: Plan[] = [
  {
    id: 'standard',
    name: 'Standard',
    monthly: 350,
    annual: 280,
    tagline: 'All the basic features to get you started',
    features: [
      'Clients and Matters',
      'Cases and Tasks',
      'Document Storage',
      'Basic Calendar and Deadlines',
      'Invoicing and Billing',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthly: 550,
    annual: 440,
    tagline: 'All Standard features, plus',
    features: [
      'Matter Budgets',
      'Advanced Reporting',
      'Full Text Search',
      'Advanced Tasks and Automations',
      'Client Portal',
      'Ghanaian Legal AI Assistant',
    ],
  },
  {
    id: 'suite',
    name: 'Suite',
    monthly: null,
    annual: null,
    tagline: 'All Premium features, plus',
    features: [
      'Matter Budgets',
      'Advanced Reporting',
      'Full Text Search',
      'Advanced Tasks and Automations',
      'Client Portal',
      'Dedicated success manager',
      'Custom integrations and SSO',
    ],
  },
]

// Mock current plan — pretend the firm is on Premium trial.
const CURRENT_PLAN: PlanId = 'premium'

function PaymentInfoTab() {
  const [period, setPeriod] = useState<BillingPeriod>('annual')

  return (
    <div className="max-w-6xl">
      <div className="text-center mb-2">
        <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--navy)' }}>Choose your plan</h2>
      </div>
      <p className="text-center text-sm mb-1" style={{ color: '#6B7280' }}>
        Choose your plan and continue using LegaLite to help run your firm.
      </p>
      <p className="text-center text-sm font-bold mb-6" style={{ color: 'var(--navy)' }}>
        You&rsquo;ve been trialing <span style={{ color: 'var(--gold)' }}>Premium</span>.
      </p>

      {/* Billing period toggle */}
      <div className="flex flex-col items-center mb-8">
        <div className="inline-flex items-center gap-6">
          <PeriodOption label="Pay monthly"   value="monthly" active={period === 'monthly'} onSelect={setPeriod} />
          <PeriodOption label="Pay annually"  value="annual"  active={period === 'annual'}  onSelect={setPeriod} />
        </div>
        <p className="text-xs mt-1.5" style={{ color: '#6B7280' }}>(save more with an annual plan)</p>
      </div>

      {/* Plan grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            period={period}
            isCurrent={plan.id === CURRENT_PLAN}
          />
        ))}
      </div>
    </div>
  )
}

function PeriodOption({
  label, value, active, onSelect,
}: {
  label: string
  value: BillingPeriod
  active: boolean
  onSelect: (v: BillingPeriod) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="inline-flex items-center gap-2 text-sm font-semibold"
      style={{ color: active ? 'var(--navy)' : '#6B7280' }}
    >
      <span
        aria-hidden
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
        style={{ borderColor: active ? 'var(--gold)' : '#9CA3AF' }}
      >
        {active && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />}
      </span>
      {label}
    </button>
  )
}

function PlanCard({
  plan, period, isCurrent,
}: {
  plan: Plan
  period: BillingPeriod
  isCurrent: boolean
}) {
  const price = period === 'annual' ? plan.annual : plan.monthly
  const isCustom = price === null

  return (
    <div className="relative">
      {isCurrent && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase shadow-sm"
          style={{ background: 'var(--gold)', color: 'white' }}
        >
          You&rsquo;ve been trialing
        </div>
      )}
      <div
        className="rounded-2xl border h-full flex flex-col p-6"
        style={{
          background: 'var(--cream-white)',
          borderColor: isCurrent ? 'var(--gold)' : 'var(--border)',
          borderWidth: isCurrent ? '2px' : '1px',
          boxShadow: isCurrent ? '0 8px 32px rgba(201,151,43,0.18)' : '0 4px 24px rgba(13,27,42,0.06)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <h3 className="font-heading text-2xl font-extrabold mb-3" style={{ color: 'var(--navy)' }}>
            {plan.name}
          </h3>

          {isCustom ? (
            <div className="py-4">
              <Link
                href="/contact-us"
                className="inline-block text-base font-semibold underline underline-offset-2"
                style={{ color: 'var(--gold)' }}
              >
                Talk to our Team for Pricing
              </Link>
            </div>
          ) : (
            <>
              <div className="font-heading text-4xl font-extrabold" style={{ color: 'var(--navy)' }}>
                GHS {price?.toLocaleString()}
              </div>
              <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                per user / month (GHS)
              </p>
              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                {period === 'annual' ? 'billed annually' : 'billed monthly'} · before relevant discounts
              </p>
            </>
          )}
        </div>

        {/* Features */}
        <div className="flex-1">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--navy)' }}>
            {plan.tagline}
          </p>
          <ul className="space-y-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--navy)' }}>
                <Check size={14} strokeWidth={2.5} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/settings/account-info/plans/${plan.id}`}
            className="block mt-5 text-center text-xs font-semibold underline underline-offset-2"
            style={{ color: 'var(--gold)' }}
          >
            See full feature list
          </Link>
        </div>

        {/* CTA */}
        <div className="mt-6">
          {isCurrent ? (
            <button
              type="button"
              disabled
              className="w-full rounded-md px-4 py-2.5 text-sm font-semibold"
              style={{ background: 'rgba(201,151,43,0.12)', color: 'var(--gold)', cursor: 'default' }}
            >
              Current plan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toast.success(`Plan switch to ${plan.name} captured (dev preview).`)}
              className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--navy)' }}
            >
              {isCustom ? 'Contact Sales' : `Choose ${plan.name}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Account Administration tab ─────────────────────────────────────────────

// Mock current owner — in production: resolve via useAuthStore + useFirmContext.
const CURRENT_OWNER = {
  name: 'Nhyiraba Davi',
  email: 'nhyiraba@daviddavis.legal',
  initials: 'ND',
}

function AccountAdministrationTab() {
  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2" style={{ color: '#9CA3AF' }}>
            Account Administration
          </div>
          <h2 className="font-heading text-3xl font-extrabold mb-3 leading-tight" style={{ color: 'var(--navy)' }}>
            You are the Firm Owner
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            One person holds the keys to the firm. You manage billing, calendar control, and decide who can administer alongside you.
          </p>
        </div>
        <Link
          href="/settings/roles"
          className="inline-flex items-center gap-1 text-sm font-semibold mt-2 shrink-0 transition-opacity hover:opacity-70"
          style={{ color: 'var(--gold)' }}
        >
          Review all account roles <ArrowRight size={14} strokeWidth={2.25} />
        </Link>
      </div>

      {/* Current owner identity strip */}
      <SectionEyebrow>Current owner</SectionEyebrow>
      <div
        className="rounded-2xl border p-5 mb-10 flex items-center gap-4"
        style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-heading text-base font-bold shrink-0"
          style={{ background: 'var(--navy)', color: 'white' }}
        >
          {CURRENT_OWNER.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base" style={{ color: 'var(--navy)' }}>{CURRENT_OWNER.name}</span>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(201,151,43,0.15)', color: 'var(--gold)' }}
            >
              <Crown size={10} strokeWidth={2.5} /> Firm Owner
            </span>
          </div>
          <p className="text-sm mt-0.5 truncate" style={{ color: '#6B7280' }}>{CURRENT_OWNER.email}</p>
        </div>
      </div>

      {/* Owner powers — 2x2 grid */}
      <SectionEyebrow>Powers of this role</SectionEyebrow>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <PowerCard
          Icon={CreditCard}
          title="Subscription & Billing"
          body="Holds the firm’s LegaLite subscription. Manages plan changes, payment methods, and billing details."
          href="/firm/billing"
          ctaLabel="Manage billing"
        />
        <PowerCard
          Icon={CalendarBlank}
          title="Firm Calendar"
          body="Sole control over court dates, deadlines, and the firm-wide calendar."
          href="/firm/calendar"
          ctaLabel="Open firm calendar"
        />
        <PowerCard
          Icon={UsersIcon}
          title="Administrators"
          body="Delegate administrative power. Admins can invite, remove, and reassign members alongside you."
          href="/settings/roles"
          ctaLabel="Designate administrators"
        />
        <PowerCard
          Icon={ArrowsLeftRight}
          title="Ownership Transfer"
          body="There is only one firm owner. Ownership is transferable to another member, but never duplicated."
          href="/settings/transfer-ownership"
          ctaLabel="Begin transfer"
        />
      </div>

      {/* Edge-case + identity callouts */}
      <SectionEyebrow>If something goes wrong</SectionEyebrow>
      <div className="space-y-4">
        <RefinedCallout
          Icon={Warning}
          title="If the firm owner is no longer at the firm"
          body={
            <>
              If the owner has left the firm or is locked out of the account, the transfer can be done by{' '}
              <Link href="/settings/transfer-ownership/affidavit" className="underline underline-offset-2 font-semibold" style={{ color: '#92400E' }}>
                submitting a sworn affidavit
              </Link>
              . LegaLite Support will review and complete the transfer manually.
            </>
          }
        />

        <RefinedCallout
          Icon={Shield}
          title="Identity confirmation required"
          body="To secure your account, your identity must be confirmed before you can transfer ownership. This protects your firm from unauthorized changes."
          action={{
            label: 'Verify my identity',
            onClick: () => toast.message('Identity verification flow is not wired yet — coming with the auth-restore work.'),
          }}
        />
      </div>
    </div>
  )
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-[3px] uppercase mb-3" style={{ color: 'var(--navy)' }}>
      {children}
    </div>
  )
}

function PowerCard({
  Icon, title, body, href, ctaLabel,
}: {
  Icon: typeof CreditCard
  title: string
  body: string
  href: string
  ctaLabel: string
}) {
  return (
    <div
      className="rounded-2xl border p-5 transition-colors group"
      style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
          style={{ background: 'rgba(201,151,43,0.10)' }}
        >
          <Icon size={18} strokeWidth={1.75} style={{ color: 'var(--gold)' }} />
        </span>
        <h4 className="font-heading text-base font-bold" style={{ color: 'var(--navy)' }}>
          {title}
        </h4>
      </div>
      <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B7280' }}>
        {body}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ color: 'var(--gold)' }}
      >
        {ctaLabel} <ArrowRight size={13} strokeWidth={2.25} />
      </Link>
    </div>
  )
}

function RefinedCallout({
  Icon, title, body, action,
}: {
  Icon: typeof Warning
  title: string
  body: React.ReactNode
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex items-start gap-4"
      style={{ background: 'rgba(245, 158, 11, 0.06)', borderColor: 'rgba(245, 158, 11, 0.30)' }}
    >
      <span
        className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 mt-0.5"
        style={{ background: 'rgba(245, 158, 11, 0.18)' }}
      >
        <Icon size={18} strokeWidth={2} style={{ color: '#B45309' }} />
      </span>
      <div className="flex-1">
        <p className="font-bold text-sm mb-1.5" style={{ color: '#78350F' }}>{title}</p>
        <p className="text-sm leading-relaxed" style={{ color: '#92400E' }}>{body}</p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--navy)' }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

function TabPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-3xl rounded-xl border p-10 text-center" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}>
      <h3 className="font-heading text-lg font-bold mb-2" style={{ color: 'var(--navy)' }}>{title}</h3>
      <p className="text-sm" style={{ color: '#6B7280' }}>{body}</p>
    </div>
  )
}

// ── Small primitives ───────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="font-heading text-base font-bold mb-3" style={{ color: 'var(--navy)' }}>{title}</h3>
      {children}
    </div>
  )
}

function SectionDivider() {
  return <div className="h-px mb-6" style={{ background: 'var(--border)' }} />
}

function FieldLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm font-semibold mb-1.5 ${className}`} style={{ color: 'var(--navy)' }}>
      {children}
    </label>
  )
}

function SelectNative({
  value, onChange, options, fullWidth,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  fullWidth?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none rounded-md border bg-white h-10 px-3 pr-9 text-sm transition-colors hover:bg-black/[0.02] focus:outline-none focus:border-yellow-600 ${fullWidth ? 'w-full' : 'w-full'}`}
      style={{
        borderColor: 'var(--border)',
        color: 'var(--navy)',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2.25\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '12px',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

// ── Brand colour picker ────────────────────────────────────────────────

/**
 * Preset brand-colour swatches. Tuned to read well against the
 * sidebar's dark glass background — included LegaLite's two house
 * accents plus a few colours common in legal-firm branding
 * (forest, burgundy, slate, indigo). The eyedropper at the end is
 * the native HTML colour input for "anything else".
 */
const BRAND_COLOR_PRESETS = [
  { value: '#0D1B2A', label: 'Navy' },
  { value: '#C9972B', label: 'Gold' },
  { value: '#1B4332', label: 'Forest' },
  { value: '#7B1F23', label: 'Burgundy' },
  { value: '#3A4A5D', label: 'Slate' },
  { value: '#3F3D7E', label: 'Indigo' },
  { value: '#0F766E', label: 'Teal' },
  { value: '#374151', label: 'Charcoal' },
] as const

/**
 * Picker UI: a row of preset swatches + a custom colour input +
 * a clear button. Every change calls back immediately so the form
 * state stays in sync with the visible selection.
 *
 * Live preview chip on the right shows what the sidebar will
 * render with the current colour + firm name — same shape, same
 * initials, same contrast logic — so the user picks with
 * confidence.
 */
function BrandColorPicker({
  value,
  onChange,
  firmName,
}: {
  value: string | null
  onChange: (color: string | null) => void
  firmName: string
}) {
  const initials = firmName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'
  // If the current value isn't one of the presets, surface it on
  // the custom-colour input so the user sees they're using a
  // bespoke shade.
  const isCustom = value !== null && !BRAND_COLOR_PRESETS.some((p) => p.value === value)
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Live preview chip — square, mirrors the sidebar render. */}
      <span
        aria-hidden
        title="Sidebar preview"
        className="inline-flex items-center justify-center h-10 w-10 rounded-md text-[12px] font-semibold border shrink-0"
        style={{
          background: value ?? 'transparent',
          color: value ? readableTextOnBg(value) : '#9CA3AF',
          borderColor: value ? value : 'var(--border)',
        }}
      >
        {value ? initials : '—'}
      </span>

      {/* Preset swatch row. Selected preset gets a ring so the
          active choice stays obvious. */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {BRAND_COLOR_PRESETS.map((p) => {
          const active = value === p.value
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              title={p.label}
              aria-label={`${p.label} brand colour`}
              aria-pressed={active}
              className="h-7 w-7 rounded-md transition-transform cursor-pointer hover:scale-110"
              style={{
                background: p.value,
                boxShadow: active
                  ? '0 0 0 2px white, 0 0 0 4px var(--gold)'
                  : '0 0 0 1px var(--border)',
              }}
            />
          )
        })}
        {/* Custom colour input — native HTML colour picker. The
            label wraps it so the entire chip is clickable. */}
        <label
          title="Custom colour"
          className="relative h-7 w-7 rounded-md cursor-pointer overflow-hidden flex items-center justify-center"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            boxShadow: isCustom ? '0 0 0 2px white, 0 0 0 4px var(--gold)' : undefined,
          }}
        >
          <input
            type="color"
            value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#888888'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {/* Diagonal rainbow strip hinting at "any colour". */}
          <span
            aria-hidden
            className="absolute inset-1 rounded-sm"
            style={{
              background:
                'conic-gradient(from 180deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #6366f1, #ec4899, #ef4444)',
              opacity: 0.85,
            }}
          />
        </label>
      </div>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs font-semibold underline underline-offset-2"
          style={{ color: '#6B7280' }}
        >
          Clear colour
        </button>
      )}
    </div>
  )
}

/**
 * Mirrors the Sidebar's contrast helper so the preview chip in
 * this picker uses the exact same text-colour logic as the live
 * sidebar render — what the user sees here is what they get.
 */
function readableTextOnBg(bg: string): string {
  let hex = bg.trim()
  if (hex.startsWith('#')) hex = hex.slice(1)
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('')
  }
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#FFFFFF'
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const srgb = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const lum = 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
  return lum > 0.42 ? '#0D1B2A' : '#FFFFFF'
}
