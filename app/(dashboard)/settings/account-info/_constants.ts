import type { Plan, PlanId } from './_types'

export const TABS = [
  { id: 'account', label: 'Account Info' },
  { id: 'payment', label: 'Payment Info' },
  { id: 'admin',   label: 'Account Administration' },
] as const

export const COUNTRY_OPTIONS = [
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

export const DATE_FORMATS = [
  { value: 'mdy_slash', label: '12/31/2026' },
  { value: 'dmy_slash', label: '31/12/2026' },
  { value: 'ymd_dash',  label: '2026-12-31' },
  { value: 'long',      label: '31 December 2026' },
]

export const TIME_FORMATS = [
  { value: '12h', label: '11:59 PM' },
  { value: '24h', label: '23:59' },
]

export const NUMBER_FORMATS = [
  { value: 'ghs_comma', label: 'GHS x,xxx.xx' },
  { value: 'usd_comma', label: '$x,xxx.xx' },
  { value: 'eur_dot',   label: '€x.xxx,xx' },
]

export const DEFAULT_FORM = {
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

export const PLANS: Plan[] = [
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

/** Mock current plan — pretend the firm is on Premium trial. */
export const CURRENT_PLAN: PlanId = 'premium'

export const CURRENT_OWNER = {
  name: 'Nhyiraba Davi',
  email: 'nhyiraba@daviddavis.legal',
  initials: 'ND',
}

export const BRAND_COLOR_PRESETS = [
  { value: '#0D1B2A', label: 'Navy' },
  { value: '#C9972B', label: 'Gold' },
  { value: '#1B4332', label: 'Forest' },
  { value: '#7B1F23', label: 'Burgundy' },
  { value: '#3A4A5D', label: 'Slate' },
  { value: '#3F3D7E', label: 'Indigo' },
  { value: '#0F766E', label: 'Teal' },
  { value: '#374151', label: 'Charcoal' },
] as const
