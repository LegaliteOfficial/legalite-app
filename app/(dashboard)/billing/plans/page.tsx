'use client'

import { useState } from 'react'
import { Check, Crown, Buildings, Users, Sparkle, CaretDown, Lightning, Shield, FileText, ChatCircle, ChartBar, Clock, Palette, Code, Phone, Headphones, UserPlus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individual lawyers getting started',
    price: 0,
    period: '/month',
    Icon: Lightning,
    isCurrent: true,
    isPopular: false,
    features: [
      { text: '5 clients', Icon: Users },
      { text: '3 cases', Icon: FileText },
      { text: '5 AI queries/day', Icon: Sparkle },
      { text: '2 document templates', Icon: FileText },
      { text: 'Community support', Icon: ChatCircle },
      { text: 'Basic dashboard', Icon: ChartBar },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Everything you need to grow your practice',
    price: 149,
    period: '/month',
    Icon: Crown,
    isCurrent: false,
    isPopular: true,
    features: [
      { text: 'Unlimited clients', Icon: Users },
      { text: 'Unlimited cases', Icon: FileText },
      { text: '50 AI queries/day', Icon: Sparkle },
      { text: 'All 12 document templates', Icon: FileText },
      { text: 'Priority email support', Icon: ChatCircle },
      { text: 'Full dashboard analytics', Icon: ChartBar },
      { text: 'Deadline engine', Icon: Clock },
      { text: 'Document library', Icon: FileText },
      { text: 'Client communications', Icon: Phone },
    ],
  },
  {
    id: 'bingy',
    name: 'Bingy Combo',
    description: 'For a firm of up to 15 users',
    price: 999,
    period: '/month',
    Icon: Buildings,
    isCurrent: false,
    isPopular: false,
    features: [
      { text: 'Everything in Premium', Icon: Check },
      { text: 'Up to 15 team members', Icon: UserPlus },
      { text: 'Unlimited AI queries', Icon: Sparkle },
      { text: 'Custom document templates', Icon: FileText },
      { text: 'Dedicated account manager', Icon: Headphones },
      { text: 'White-label branding', Icon: Palette },
      { text: 'API access', Icon: Code },
      { text: 'Advanced analytics & reporting', Icon: ChartBar },
      { text: 'Priority phone & chat support', Icon: Phone },
      { text: 'Team collaboration tools', Icon: Users },
    ],
  },
] as const

const faqs = [
  {
    question: 'Can I switch plans at any time?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you will be charged the prorated difference for the remainder of the billing cycle. Downgrading takes effect at the start of the next billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit and debit cards, Mobile Money (MTN, Vodafone, AirtelTigo), and bank transfers for annual plans. All payments are processed securely.',
  },
  {
    question: 'Is there a free trial for Premium or Bingy Combo?',
    answer:
      'Yes, both paid plans come with a 14-day free trial. No credit card required to start. You can explore all features before committing.',
  },
  {
    question: 'What happens to my data if I downgrade?',
    answer:
      'Your data is never deleted. If you downgrade to a plan with lower limits, your existing data remains accessible in read-only mode. You can export everything at any time.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer:
      'Yes, annual billing saves you 20% compared to monthly plans. Premium drops to GHS 119/month and Bingy Combo to GHS 799/month when billed annually.',
  },
  {
    question: 'Can I add more users to the Bingy Combo plan?',
    answer:
      'The Bingy Combo plan supports up to 15 users. If you need more seats, contact our sales team for a custom enterprise arrangement tailored to your firm.',
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--border-soft)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {question}
        </span>
        <CaretDown
          size={16}
          strokeWidth={1.75}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 180ms ease',
          }}
        />
      </button>
      {isOpen && (
        <div className="pb-4 pr-8">
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Plans & billing"
          description="Choose the plan that fits your practice. Upgrade or downgrade anytime."
        />

        <div className="mt-7 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = plan.Icon
            return (
              <Card
                key={plan.id}
                variant={plan.isPopular ? 'elevated' : 'default'}
                padding="lg"
                className="relative flex flex-col"
                style={
                  plan.isPopular
                    ? { borderColor: 'rgba(201,151,43,0.40)' }
                    : undefined
                }
              >
                {plan.isPopular && (
                  <div
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium uppercase tracking-wider"
                    style={{ background: 'var(--gold)', color: 'var(--navy)' }}
                  >
                    Recommended
                  </div>
                )}

                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--surface-sunken)' }}
                  >
                    <Icon size={16} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <h2 className="font-heading text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {plan.name}
                  </h2>
                </div>
                <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="font-heading text-[32px] font-semibold leading-none tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      GHS {plan.price}
                    </span>
                    <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                      {plan.period}
                    </span>
                  </div>
                  {plan.id === 'premium' && (
                    <p className="text-[11.5px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      per person
                    </p>
                  )}
                  {plan.id === 'bingy' && (
                    <p className="text-[11.5px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      per firm, up to 15 users
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  {plan.isCurrent ? (
                    <div
                      className="w-full h-9 rounded-lg flex items-center justify-center gap-1.5 text-[13px] font-medium border"
                      style={{
                        borderColor: 'var(--border-default)',
                        background: 'var(--surface-sunken)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Shield size={13} strokeWidth={1.75} />
                      Current plan
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      variant={plan.isPopular ? 'default' : 'secondary'}
                    >
                      Upgrade to {plan.name}
                    </Button>
                  )}
                </div>

                <div
                  className="border-t mb-5"
                  style={{ borderColor: 'var(--border-soft)' }}
                />

                <div className="flex-1">
                  <p
                    className="text-[10.5px] font-medium uppercase tracking-wider mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {plan.id === 'bingy' ? 'Everything in Premium, plus' : 'What’s included'}
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => {
                      const FeatureIcon = feature.Icon
                      return (
                        <li
                          key={feature.text}
                          className="flex items-start gap-2.5 text-[13px]"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <FeatureIcon
                            size={14}
                            strokeWidth={1.75}
                            className="mt-0.5 shrink-0"
                            style={{ color: 'var(--text-muted)' }}
                          />
                          <span>{feature.text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mt-10 max-w-3xl">
          <h2
            className="font-heading text-xl font-semibold tracking-tight mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Frequently asked questions
          </h2>
          <p className="text-[13.5px] mb-5" style={{ color: 'var(--text-secondary)' }}>
            Everything you need to know about LegaLite plans and billing.
          </p>

          <Card padding="none" className="px-5">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
