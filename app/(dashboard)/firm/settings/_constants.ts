/** The 16 administrative regions of Ghana (post-2019). */
export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Western North',
  'Central',
  'Eastern',
  'Volta',
  'Oti',
  'Northern',
  'Savannah',
  'North East',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
] as const

/** Legal-practice structures recognised under Ghanaian practice. */
export const FIRM_TYPES: { value: string; label: string }[] = [
  { value: 'sole_practitioner', label: 'Sole practitioner' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'Limited liability partnership' },
  { value: 'chambers', label: 'Chambers' },
  { value: 'in_house', label: 'In-house / legal department' },
]

export const FIRM_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  FIRM_TYPES.map((t) => [t.value, t.label]),
)

/** Brand colour swatches — mirrors the Account Info palette. */
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
