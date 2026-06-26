'use client'

import { useState } from 'react'
import { CreditCard, DeviceMobile } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useSubscriptionStore,
  type PaymentMethod,
} from '@/stores/subscription-local.store'

/** The payment method on file, with an update dialog (MoMo or card). */
export function PaymentMethodCard() {
  const method = useSubscriptionStore((s) => s.account.paymentMethod)
  const [open, setOpen] = useState(false)

  return (
    <section
      className="rounded-2xl border overflow-hidden h-full"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
    >
      <div className="flex items-center justify-between gap-4 p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-heading text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          Payment method
        </h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-md border px-3 py-1.5 text-[13px] font-semibold transition-colors hover:bg-black/[0.02]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          {method ? 'Update' : 'Add'}
        </button>
      </div>

      <div className="p-5">
        {method ? (
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
              style={{ background: 'var(--surface-overlay)' }}
            >
              {method.kind === 'momo' ? (
                <DeviceMobile size={19} style={{ color: 'var(--navy)' }} />
              ) : (
                <CreditCard size={19} style={{ color: 'var(--navy)' }} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {method.kind === 'momo' ? method.network : method.brand} ····{' '}
                {method.last4}
              </p>
              <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
                {method.kind === 'momo'
                  ? 'Mobile money wallet'
                  : `Expires ${method.expiry}`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            No payment method on file. Add one to keep your subscription active.
          </p>
        )}
      </div>

      <PaymentMethodDialog open={open} onOpenChange={setOpen} current={method} />
    </section>
  )
}

function PaymentMethodDialog({
  open,
  onOpenChange,
  current,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: PaymentMethod | null
}) {
  const setPaymentMethod = useSubscriptionStore((s) => s.setPaymentMethod)
  const [kind, setKind] = useState<'momo' | 'card'>(current?.kind ?? 'momo')
  const [momoNumber, setMomoNumber] = useState('')
  const [network, setNetwork] = useState('MTN Mobile Money')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')

  const last4 = (s: string) => s.replace(/\D/g, '').slice(-4)

  const save = () => {
    if (kind === 'momo') {
      const digits = momoNumber.replace(/\D/g, '')
      if (digits.length < 9) {
        toast.error('Enter a valid mobile money number.')
        return
      }
      setPaymentMethod({ kind: 'momo', network, last4: last4(momoNumber) })
    } else {
      const digits = cardNumber.replace(/\D/g, '')
      if (digits.length < 12) {
        toast.error('Enter a valid card number.')
        return
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        toast.error('Enter expiry as MM/YY.')
        return
      }
      setPaymentMethod({ kind: 'card', brand: 'Card', last4: last4(cardNumber), expiry })
    }
    toast.success('Payment method updated.')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Update payment method</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-2">
            {(['momo', 'card'] as const).map((k) => {
              const active = kind === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className="rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors"
                  style={{
                    borderColor: active ? 'var(--gold)' : 'var(--border)',
                    background: active ? 'var(--gold-muted)' : 'var(--surface-card)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {k === 'momo' ? 'Mobile money' : 'Card'}
                </button>
              )
            })}
          </div>

          {kind === 'momo' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="pm-network">Network</Label>
                <select
                  id="pm-network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:border-yellow-600"
                  style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
                >
                  <option>MTN Mobile Money</option>
                  <option>Telecel Cash</option>
                  <option>AirtelTigo Money</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pm-momo">Wallet number</Label>
                <Input
                  id="pm-momo"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  placeholder="024 123 4567"
                  inputMode="numeric"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="pm-card">Card number</Label>
                <Input
                  id="pm-card"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pm-exp">Expiry (MM/YY)</Label>
                <Input
                  id="pm-exp"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="08/28"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} style={{ background: 'var(--gold)', color: 'white' }}>
            Save method
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
