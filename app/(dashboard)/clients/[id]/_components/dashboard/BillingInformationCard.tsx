'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CollapsibleCard } from '../CollapsibleCard'
import { Row } from './Row'

/**
 * Billing-info stub. Surfaces the shape (LEDES ID / Tax ID / Profile /
 * Rates / Currency / Method) with em-dashes until the contact-detail
 * migration lands billing columns on Client.
 */
export function BillingInformationCard() {
  return (
    <CollapsibleCard
      label="Billing information"
      rightSlot={
        <Button
          size="sm"
          onClick={() =>
            toast.info('Billing settings ship with the billing screen.')
          }
        >
          Manage
        </Button>
      }
    >
      <dl className="space-y-3 text-[13px]">
        <Row label="LEDES client ID" value={null} />
        <Row label="Tax identifier" value={null} />
        <Row label="Payment profile" value="Default (30 days)" />
        <Row label="Rates" value={null} />
        <Row label="Currency" value="GHS" />
        <Row label="Payment method" value={null} />
      </dl>
    </CollapsibleCard>
  )
}
