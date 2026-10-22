'use client'

/**
 * Client billing on the firm dashboard.
 *
 * Bills were being raised and paid but never surfaced here, so the firm
 * tab showed utilisation with no sight of the money it turned into. Reads
 * the same aggregation as the utilisation chart, scoped to the year the
 * bills were issued in.
 *
 * Draft and pending-approval bills are deliberately excluded: neither has
 * been sent, so neither is money the firm has actually asked for.
 */

import Link from 'next/link'
import { Receipt, ArrowRight } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format-currency'
import { useFirmUtilisation } from '@/hooks/use-firm-utilisation'
import { useClientRatesStore } from '@/stores/client-rates-local.store'

export function FirmBilling({ year }: { year: number }) {
  const data = useFirmUtilisation(year)
  const currency = useClientRatesStore((s) => s.firm_default_currency)
  const { invoiced, collected, outstanding, openCount, overdueCount } = data.billing

  const figures = [
    {
      label: 'Invoiced',
      value: formatCurrency(invoiced, currency),
      note: `${year} to date`,
      tone: 'var(--text-primary)',
    },
    {
      label: 'Collected',
      value: formatCurrency(collected, currency),
      // A share is more useful than the number alone: 40k collected means
      // something different against 50k invoiced than against 400k.
      note:
        invoiced > 0
          ? `${Math.round((collected / invoiced) * 100)}% of invoiced`
          : 'Nothing invoiced yet',
      tone: '#2E7D4F',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(outstanding, currency),
      note:
        openCount === 0
          ? 'No open bills'
          : overdueCount > 0
            ? `${openCount} open · ${overdueCount} overdue`
            : `${openCount} open`,
      tone: overdueCount > 0 ? '#C0392B' : 'var(--text-primary)',
    },
  ]

  return (
    <Card padding="none" className="overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <span
          className="inline-flex items-center gap-2 text-[15px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          <Receipt size={15} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
          Client billing
        </span>
        <Link
          href="/billing"
          className="inline-flex items-center gap-1 text-[12.5px] font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Open billing
          <ArrowRight size={11} strokeWidth={2} />
        </Link>
      </div>

      <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        {figures.map((f) => (
          <div key={f.label} className="px-4 py-4 sm:px-6">
            <div
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {f.label}
            </div>
            <div
              className="font-heading mt-1 text-[22px] font-semibold leading-tight tracking-tight tabular-nums"
              style={{ color: f.tone }}
            >
              {f.value}
            </div>
            <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              {f.note}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
