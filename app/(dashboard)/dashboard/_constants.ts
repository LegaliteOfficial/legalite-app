/**
 * Dashboard — static configuration.
 */

import {
  FileText,
  Scales,
  Timer,
  UserPlus,
} from '@phosphor-icons/react'
import type { CSSProperties, ComponentType } from 'react'

interface QuickAction {
  label: string
  Icon: ComponentType<{
    size?: number
    strokeWidth?: number
    style?: CSSProperties
  }>
  href: string
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Add new client', Icon: UserPlus, href: '/clients' },
  { label: 'Open new case', Icon: Scales, href: '/cases' },
  { label: 'Generate document', Icon: FileText, href: '/documents' },
  { label: 'Calculate deadline', Icon: Timer, href: '/deadline' },
]

export const TABS = [
  { id: 'personal', label: 'Personal' },
  { id: 'firm', label: 'Firm' },
  { id: 'performance', label: 'Performance' },
  { id: 'feed', label: 'Activity' },
] as const

export const BANNER_DISMISSED_KEY = 'll:dash:onboarding-banner-dismissed'

// ── Firm overview / utilisation chart ──────────────────────────────────────

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export const Y_TICKS = [1, 0.8, 0.6, 0.4, 0.2, 0]

export const UTILISATION_COLORS = {
  billable: '#0D1B2A',
  nonBillable: '#9CA3AF',
  untracked: '#C0392B',
}

export const UNIT_OPTIONS = [
  { id: 'hr', label: 'Hr.' },
  { id: 'ghs', label: 'GHS' },
  { id: 'pct', label: '%' },
] as const
