export type TabId = 'account' | 'payment' | 'admin'
export type BillingPeriod = 'monthly' | 'annual'
export type PlanId = 'standard' | 'premium' | 'suite'

export type Plan = {
  id: PlanId
  name: string
  badge?: string
  monthly: number | null
  annual: number | null
  tagline: string
  features: string[]
}
