/** Where plan changes and subscription questions go. */
export const BILLING_EMAIL = 'billing@legalite.app'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

/** Display name for the firm's plan (firms.plan). */
export function planLabel(plan: string | null | undefined): string {
  if (!plan) return 'Free'
  return PLAN_LABELS[plan] ?? plan.charAt(0).toUpperCase() + plan.slice(1)
}
