'use client'

import { DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useSubscriptionStore } from '@/stores/subscription-local.store'
import { formatDate, formatGhs } from '../_lib/format'

/** Past subscription invoices with a (stub) download per row. */
export function BillingHistoryCard() {
  const invoices = useSubscriptionStore((s) => s.invoices)

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
    >
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-heading text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          Billing history
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Receipts for your LegaLite subscription.
        </p>
      </div>

      {invoices.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          No invoices yet.
        </p>
      ) : (
        <>
          <div
            className="grid grid-cols-[110px_1fr_110px_90px_44px] gap-3 px-5 py-2.5 border-b text-[11px] font-bold uppercase tracking-wider"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <span>Date</span>
            <span>Description</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
            <span className="text-right">PDF</span>
          </div>
          <ul>
            {invoices.map((inv, i) => (
              <li
                key={inv.id}
                className="grid grid-cols-[110px_1fr_110px_90px_44px] gap-3 px-5 py-3 items-center"
                style={{
                  borderBottom: i === invoices.length - 1 ? 'none' : '1px solid var(--border)',
                }}
              >
                <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(inv.date)}
                </span>
                <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {inv.description}
                </span>
                <span className="text-[13px] text-right tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatGhs(inv.amountGhs)}
                </span>
                <span>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                    style={
                      inv.status === 'paid'
                        ? { background: 'rgba(33,106,67,0.12)', color: '#216A43' }
                        : { background: 'rgba(192,57,43,0.12)', color: '#C0392B' }
                    }
                  >
                    {inv.status === 'paid' ? 'Paid' : 'Due'}
                  </span>
                </span>
                <span className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => toast.success(`Receipt ${inv.id} downloaded.`)}
                    aria-label={`Download ${inv.id}`}
                    className="h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--surface-overlay)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <DownloadSimple size={15} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
