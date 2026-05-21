'use client'

import { useState } from 'react'
import {
  Check,
  Crown,
  Building2,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  FileText,
  MessageSquare,
  BarChart3,
  Clock,
  Palette,
  Code,
  Phone,
  Headphones,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individual lawyers getting started',
    price: 0,
    period: '/month',
    icon: Zap,
    isCurrent: true,
    isPopular: false,
    features: [
      { text: '5 clients', icon: Users },
      { text: '3 cases', icon: FileText },
      { text: '5 AI queries/day', icon: Sparkles },
      { text: '2 document templates', icon: FileText },
      { text: 'Community support', icon: MessageSquare },
      { text: 'Basic dashboard', icon: BarChart3 },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For one person - everything you need to grow',
    price: 149,
    period: '/month',
    icon: Crown,
    isCurrent: false,
    isPopular: true,
    features: [
      { text: 'Unlimited clients', icon: Users },
      { text: 'Unlimited cases', icon: FileText },
      { text: '50 AI queries/day', icon: Sparkles },
      { text: 'All 12 document templates', icon: FileText },
      { text: 'Priority email support', icon: MessageSquare },
      { text: 'Full dashboard analytics', icon: BarChart3 },
      { text: 'Deadline engine', icon: Clock },
      { text: 'Document library', icon: FileText },
      { text: 'Client communications', icon: Phone },
    ],
  },
  {
    id: 'bingy',
    name: 'Bingy Combo',
    description: 'For a firm of up to 15 users',
    price: 999,
    period: '/month',
    icon: Building2,
    isCurrent: false,
    isPopular: false,
    features: [
      { text: 'Everything in Premium', icon: Check },
      { text: 'Up to 15 team members', icon: UserPlus },
      { text: 'Unlimited AI queries', icon: Sparkles },
      { text: 'Custom document templates', icon: FileText },
      { text: 'Dedicated account manager', icon: Headphones },
      { text: 'White-label branding', icon: Palette },
      { text: 'API access', icon: Code },
      { text: 'Advanced analytics & reporting', icon: BarChart3 },
      { text: 'Priority phone & chat support', icon: Phone },
      { text: 'Team collaboration tools', icon: Users },
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
    <div
      className="border-b"
      style={{ borderColor: 'rgba(201, 151, 43, 0.15)' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left transition-colors hover:opacity-80"
      >
        <span
          className="font-medium text-[15px]"
          style={{ color: 'var(--navy)' }}
        >
          {question}
        </span>
        {isOpen ? (
          <ChevronUp size={18} style={{ color: 'var(--gold)' }} />
        ) : (
          <ChevronDown size={18} style={{ color: '#9CA3AF' }} />
        )}
      </button>
      {isOpen && (
        <div className="pb-5 pr-8">
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--cream)' }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-2">
        <h1
          className="font-heading text-2xl font-bold mb-1"
          style={{ color: 'var(--navy)' }}
        >
          Plans & Billing
        </h1>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Choose the plan that fits your practice. Upgrade or downgrade at any
          time.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className="relative rounded-xl border-2 p-6 flex flex-col transition-shadow hover:shadow-lg"
                style={{
                  background: plan.isPopular
                    ? 'linear-gradient(180deg, rgba(201,151,43,0.03) 0%, white 100%)'
                    : 'white',
                  borderColor: plan.isPopular
                    ? 'var(--gold)'
                    : 'rgba(201, 151, 43, 0.12)',
                }}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold tracking-wide text-white"
                    style={{ background: 'var(--gold)' }}
                  >
                    RECOMMENDED
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: plan.isPopular
                          ? 'var(--gold)'
                          : 'rgba(201, 151, 43, 0.08)',
                      }}
                    >
                      <Icon
                        size={18}
                        style={{
                          color: plan.isPopular ? 'white' : 'var(--gold)',
                        }}
                      />
                    </div>
                    <h2
                      className="font-heading text-lg font-bold"
                      style={{ color: 'var(--navy)' }}
                    >
                      {plan.name}
                    </h2>
                  </div>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: '#6B7280' }}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="font-heading text-4xl font-bold"
                      style={{ color: 'var(--navy)' }}
                    >
                      GHS {plan.price}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: '#9CA3AF' }}
                    >
                      {plan.period}
                    </span>
                  </div>
                  {plan.id === 'premium' && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: '#9CA3AF' }}
                    >
                      per person
                    </p>
                  )}
                  {plan.id === 'bingy' && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: '#9CA3AF' }}
                    >
                      per firm, up to 15 users
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <div className="mb-6">
                  {plan.isCurrent ? (
                    <div
                      className="w-full h-9 rounded-lg flex items-center justify-center text-sm font-medium border"
                      style={{
                        borderColor: 'var(--gold)',
                        color: 'var(--gold)',
                        background: 'rgba(201, 151, 43, 0.04)',
                      }}
                    >
                      <Shield size={14} className="mr-1.5" />
                      Current Plan
                    </div>
                  ) : (
                    <Button
                      className="w-full h-9 text-sm font-semibold text-white cursor-pointer"
                      style={{
                        background: plan.isPopular
                          ? 'var(--gold)'
                          : 'var(--navy)',
                      }}
                    >
                      Upgrade to {plan.name}
                    </Button>
                  )}
                </div>

                {/* Divider */}
                <div
                  className="border-t mb-5"
                  style={{ borderColor: 'rgba(201, 151, 43, 0.1)' }}
                />

                {/* Features */}
                <div className="flex-1">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                    style={{ color: '#9CA3AF' }}
                  >
                    {plan.id === 'bingy' ? 'Everything in Premium, plus' : 'What\u2019s included'}
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => {
                      const FeatureIcon = feature.icon
                      return (
                        <li
                          key={feature.text}
                          className="flex items-start gap-2.5 text-sm"
                          style={{ color: '#374151' }}
                        >
                          <FeatureIcon
                            size={15}
                            className="mt-0.5 shrink-0"
                            style={{ color: 'var(--gold)' }}
                          />
                          <span>{feature.text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="px-6 pb-12">
        <div className="max-w-3xl">
          <div className="mb-6">
            <h2
              className="font-heading text-xl font-bold mb-1"
              style={{ color: 'var(--navy)' }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Everything you need to know about LegaLite plans and billing.
            </p>
          </div>

          <div
            className="rounded-xl border p-1"
            style={{
              background: 'white',
              borderColor: 'rgba(201, 151, 43, 0.12)',
            }}
          >
            <div className="px-5">
              {faqs.map((faq) => (
                <FAQItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
