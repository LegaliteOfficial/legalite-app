'use client'

/**
 * TopUpRequestDialog
 * ------------------
 * Lets the firm ask a client to top up their retainer. Opens from
 * the Client Funds tab's "Top up" link.
 *
 * Two delivery paths:
 *
 *   Email     → Pre-fills subject + body from a default template
 *               with the client name, trust balance, outstanding,
 *               and optional suggested amount substituted in.
 *               The partner edits inline. "Send email" opens their
 *               default mail client via a `mailto:` URL — no SMTP
 *               needed, the OS handles the send.
 *
 *   Phone     → Surfaces the client's phone number with a one-click
 *               `tel:` open-dialer link, and a notes textarea so
 *               the partner can capture the gist of the conversation
 *               into the audit log.
 *
 *   In person → Just the notes textarea; the partner logs that the
 *               ask happened face-to-face.
 *
 * Every send writes a ClientFundsRequest record into the bills
 * store so the firm has an audit trail of who asked what, when,
 * via which channel. Pending records also surface back into the
 * Outstanding column on the funds table (future).
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Check,
  Copy,
  Mail,
  Phone,
  RefreshCw,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/auth.store'
import { useEffectiveFirmName, useHasCustomFirmName } from '@/hooks/use-firm-name'
import { useClients } from '@/hooks/use-clients'
import { useBillsLocalStore } from '@/stores/bills-local.store'
import { outstandingFor } from '@/stores/bills-local.store'
import { formatCurrency } from '@/lib/format-currency'

interface TopUpRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string | null
}

type Channel = 'email' | 'phone' | 'in_person'
type RequestKind = 'generic' | 'specific'

// Money is formatted through the firm-currency-aware helper so the
// top-up email body / subject pick up whatever billing currency the
// firm has set in Settings.
function fmtMoney(n: number): string {
  return formatCurrency(n)
}

/**
 * Default email template. Returns separate subject + body strings
 * so the dialog can reset either independently. Placeholders are
 * substituted at compose time, not stored — that way changing
 * `firmName` later doesn't retroactively edit old request logs.
 *
 * `firmName` is the resolved string from `useEffectiveFirmName`,
 * and `firmNameIsCustom` tells us whether that came from the
 * branding store / sign-up membership (a real firm-chosen name) or
 * from the generic sentence fallback ("our firm"). When it's the
 * fallback, we:
 *   - drop the firm-name suffix from the subject line so the
 *     subject doesn't read "Retainer top-up request — our firm"
 *   - drop the firm-name line under the sign-off so the email
 *     doesn't end with a bare "our firm"
 * The in-sentence reference ("Thank you for your continued trust
 * in our firm") still reads naturally either way.
 */
function buildDefaultTemplate(args: {
  clientName: string
  firmName: string
  firmNameIsCustom: boolean
  partnerName: string | null
  trustBalance: number
  outstanding: number
  kind: RequestKind
  amount: number | null
}): { subject: string; body: string } {
  const subjectFirmSuffix = args.firmNameIsCustom ? ` — ${args.firmName}` : ''
  const subject =
    args.kind === 'specific' && args.amount
      ? `Retainer top-up request — ${fmtMoney(args.amount)}`
      : `Retainer top-up request${subjectFirmSuffix}`

  const amountLine =
    args.kind === 'specific' && args.amount
      ? `\nSuggested top-up amount: ${fmtMoney(args.amount)}\n`
      : ''
  const outstandingLine =
    args.outstanding > 0
      ? `Outstanding bills on file: ${fmtMoney(args.outstanding)}\n`
      : ''

  // The sign-off ends with the firm's own name when we have one,
  // otherwise just the partner — repeating "our firm" under their
  // own name would look like a placeholder slipped through.
  const signOffFirmLine = args.firmNameIsCustom ? `\n${args.firmName}` : ''

  const body =
    `Dear ${args.clientName},\n\n` +
    `Thank you for your continued trust in ${args.firmName}.\n\n` +
    `We are writing to request a top-up to your trust account so we can ` +
    `continue work on your matter without interruption.\n` +
    amountLine +
    `\nYour current trust balance: ${fmtMoney(args.trustBalance)}\n` +
    outstandingLine +
    `\nYou can send the top-up via bank transfer, cheque, or mobile money. ` +
    `If you have any questions, or would prefer to arrange this another way, ` +
    `please reply to this email or call our office.\n\n` +
    `Kind regards,\n` +
    `${args.partnerName ?? 'The partner team'}` +
    signOffFirmLine

  return { subject, body }
}

export function TopUpRequestDialog({
  open,
  onOpenChange,
  clientId,
}: TopUpRequestDialogProps) {
  const { data: clients } = useClients()
  const client = useMemo(
    () => (clients ?? []).find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  )

  // Firm name resolution flows through `useEffectiveFirmName` so the
  // chain stays consistent across every client-facing surface:
  //   1. Settings -> Account Info branding override (if customised)
  //   2. activeMembership.firm_name captured at sign-up
  //   3. legacy user.firm (for old persisted auth blobs)
  //   4. fallback 'our firm' — never the product name, because this
  //      string lands in a client's inbox where "LegaLite" would
  //      misidentify who the client actually hired.
  // The `!` is safe because we explicitly opt into a non-null
  // sentence fallback rather than 'none'.
  const firmName = useEffectiveFirmName({ fallback: 'sentence' })!
  // Whether the resolved name is a real firm-chosen value (vs the
  // sentence fallback). The template uses this to suppress the
  // firm-name suffix in the subject and the sign-off line when no
  // real name is set yet, so the email doesn't read as a draft with
  // placeholders left in.
  const firmNameIsCustom = useHasCustomFirmName()
  const partnerName = useAuthStore((s) => s.user?.name ?? null)
  const createFundsRequest = useBillsLocalStore((s) => s.createFundsRequest)

  // Live snapshot of the client's trust balance + outstanding.
  // Stays fresh while the dialog's open because we read from
  // `getState()` on each render (snapshot lookup, not a subscriber).
  const revision = useBillsLocalStore((s) => s.revision)
  const trustBalance = useMemo(() => {
    if (!clientId) return 0
    return useBillsLocalStore.getState().fund_balances[clientId]?.trust ?? 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, revision])
  const outstanding = useMemo(() => {
    if (!clientId) return 0
    return outstandingFor(clientId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, revision])

  // ── Form state ──────────────────────────────────────────────────
  const [channel, setChannel] = useState<Channel>('email')
  const [kind, setKind] = useState<RequestKind>('generic')
  const [amountStr, setAmountStr] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [ccEmail, setCcEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [callNotes, setCallNotes] = useState('')

  /** Re-run the template generator and slot the result into state. */
  const applyTemplate = () => {
    if (!client) return
    const tpl = buildDefaultTemplate({
      clientName: client.full_name,
      firmName,
      firmNameIsCustom,
      partnerName,
      trustBalance,
      outstanding,
      kind,
      amount: kind === 'specific' ? Number(amountStr) || null : null,
    })
    setSubject(tpl.subject)
    setBody(tpl.body)
  }

  // Hydrate / reset whenever the dialog opens for a (possibly
  // different) client.
  useEffect(() => {
    if (!open || !client) return
    setChannel('email')
    setKind('generic')
    setAmountStr('')
    setRecipientEmail(client.email ?? '')
    setCcEmail('')
    setCallNotes('')
    const tpl = buildDefaultTemplate({
      clientName: client.full_name,
      firmName,
      firmNameIsCustom,
      partnerName,
      trustBalance,
      outstanding,
      kind: 'generic',
      amount: null,
    })
    setSubject(tpl.subject)
    setBody(tpl.body)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client, firmName, firmNameIsCustom, partnerName, trustBalance, outstanding])

  // Re-run the template when the kind / amount changes — but only
  // if the user hasn't customised the body yet. We can't perfectly
  // detect "untouched", so we use a soft rule: if the current body
  // starts with the same first line as a freshly-built template,
  // assume it's still the template and replace it. The user can
  // always tap "Reset template" to force a refresh.
  useEffect(() => {
    if (!open || !client) return
    const tpl = buildDefaultTemplate({
      clientName: client.full_name,
      firmName,
      firmNameIsCustom,
      partnerName,
      trustBalance,
      outstanding,
      kind,
      amount: kind === 'specific' ? Number(amountStr) || null : null,
    })
    const firstLineCurrent = body.split('\n')[0]
    const firstLineTpl = tpl.body.split('\n')[0]
    if (firstLineCurrent === firstLineTpl) {
      setSubject(tpl.subject)
      setBody(tpl.body)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, amountStr])

  if (!client) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    )
  }

  const requestedAmount = kind === 'specific' ? Number(amountStr) || null : null

  /**
   * Compose the mailto: URL the OS hands to the user's default mail
   * client. RFC 6068 + percent-encoded subject / body / cc.
   */
  const buildMailto = () => {
    const params: string[] = []
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
    if (ccEmail.trim()) params.push(`cc=${encodeURIComponent(ccEmail.trim())}`)
    if (body) params.push(`body=${encodeURIComponent(body)}`)
    const qs = params.length ? `?${params.join('&')}` : ''
    return `mailto:${encodeURIComponent(recipientEmail.trim())}${qs}`
  }

  const logRequest = (overrides?: { notes?: string }) => {
    createFundsRequest({
      client_id: client.id,
      amount: requestedAmount,
      status: 'Pending',
      channel,
      email_subject: channel === 'email' ? subject : null,
      notes:
        overrides?.notes ??
        (channel === 'email'
          ? body
          : callNotes.trim() || null),
      trust_balance_at_request: trustBalance,
    })
  }

  const handleSendEmail = () => {
    if (!recipientEmail.trim()) {
      toast.error("Add the client's email address first.")
      return
    }
    if (!subject.trim()) {
      toast.error('Subject is required.')
      return
    }
    logRequest()
    // mailto opens in a new window so we don't navigate away.
    if (typeof window !== 'undefined') {
      window.open(buildMailto(), '_self')
    }
    toast.success(`Top-up email queued in your mail client for ${client.full_name}.`)
    onOpenChange(false)
  }

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${recipientEmail}\nSubject: ${subject}\n\n${body}`)
      toast.success('Email content copied to clipboard.')
    } catch {
      toast.error("Couldn't copy. Use the textareas instead.")
    }
  }

  const handleOpenDialer = () => {
    if (!client.phone) {
      toast.error('No phone number on file for this client.')
      return
    }
    logRequest({ notes: callNotes.trim() || 'Dialed; no notes captured.' })
    if (typeof window !== 'undefined') {
      window.open(`tel:${client.phone.replace(/\s+/g, '')}`, '_self')
    }
    toast.success(`Calling ${client.full_name} — request logged.`)
    onOpenChange(false)
  }

  const handleLogInPerson = () => {
    if (!callNotes.trim()) {
      toast.error('Add a short note about the conversation first.')
      return
    }
    logRequest()
    toast.success(`In-person request logged for ${client.full_name}.`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            Top up request
            <span
              className="text-[13px] font-normal"
              style={{ color: 'var(--text-muted)' }}
            >
              — {client.full_name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Balance snapshot — gives the partner context before
              they pick an amount or send. */}
          <div
            className="rounded-md border p-3 grid grid-cols-2 gap-3"
            style={{
              borderColor: 'var(--border-soft)',
              background: 'var(--surface-sunken)',
            }}
          >
            <BalanceCell
              label="Current trust balance"
              value={fmtMoney(trustBalance)}
              accent="#2E7D4F"
            />
            <BalanceCell
              label="Outstanding bills"
              value={fmtMoney(outstanding)}
              accent={
                outstanding > 0 ? 'var(--accent-danger)' : 'var(--text-muted)'
              }
            />
          </div>

          {/* Kind: generic vs specific */}
          <div className="grid gap-1.5">
            <Label className="text-[13px]">Request type</Label>
            <div
              className="inline-flex rounded-md p-0.5 self-start"
              style={{ background: 'var(--surface-sunken)' }}
              role="radiogroup"
              aria-label="Request type"
            >
              {(
                [
                  { key: 'generic', label: 'Generic top-up' },
                  { key: 'specific', label: 'Specific amount' },
                ] as const
              ).map((opt) => {
                const active = kind === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setKind(opt.key)}
                    className="h-7 px-3 rounded text-[12.5px] font-medium cursor-pointer"
                    style={{
                      background: active
                        ? 'var(--surface-card)'
                        : 'transparent',
                      color: active
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount input — only when specific */}
          {kind === 'specific' && (
            <div className="grid gap-1.5">
              <Label htmlFor="topup-amount" className="text-[13px]">
                Suggested top-up amount (GHS)
              </Label>
              <Input
                id="topup-amount"
                type="number"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>
          )}

          {/* Channel toggle */}
          <div className="grid gap-1.5">
            <Label className="text-[13px]">Deliver via</Label>
            <div
              className="inline-flex rounded-md p-0.5 self-start"
              style={{ background: 'var(--surface-sunken)' }}
              role="radiogroup"
            >
              {(
                [
                  { key: 'email', label: 'Email', Icon: Mail },
                  { key: 'phone', label: 'Phone call', Icon: Phone },
                  { key: 'in_person', label: 'In person', Icon: Users },
                ] as const
              ).map((opt) => {
                const active = channel === opt.key
                const Icon = opt.Icon
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setChannel(opt.key)}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded text-[12.5px] font-medium cursor-pointer"
                    style={{
                      background: active
                        ? 'var(--surface-card)'
                        : 'transparent',
                      color: active
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    <Icon size={12} strokeWidth={1.75} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Email branch ────────────────────────────────── */}
          {channel === 'email' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="topup-to" className="text-[13px]">
                    To{' '}
                    <span style={{ color: 'var(--accent-danger)' }}>*</span>
                  </Label>
                  <Input
                    id="topup-to"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="topup-cc" className="text-[13px]">
                    CC (optional)
                  </Label>
                  <Input
                    id="topup-cc"
                    type="email"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="billing@firm.gh"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="topup-subject" className="text-[13px]">
                    Subject
                  </Label>
                  <button
                    type="button"
                    onClick={applyTemplate}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold underline underline-offset-2 cursor-pointer"
                    style={{ color: 'var(--accent-today)' }}
                  >
                    <RefreshCw size={10} strokeWidth={2} />
                    Reset template
                  </button>
                </div>
                <Input
                  id="topup-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="topup-body" className="text-[13px]">
                  Message
                </Label>
                <Textarea
                  id="topup-body"
                  rows={12}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {firmNameIsCustom ? (
                    <>
                      The template pulls in <strong>{firmName}</strong>,
                      the client&rsquo;s trust balance, and (when set)
                      the suggested amount. Edit anything you like — what
                      you send is exactly what we log.
                    </>
                  ) : (
                    <>
                      The template uses a generic reference to your firm
                      while branding is still set up. Add your firm name
                      in <a href="/settings/account-info" className="underline underline-offset-2">Settings &rsaquo; Account Info</a>{' '}
                      and it will flow into every email and statement.
                    </>
                  )}
                </p>
              </div>
            </>
          )}

          {/* ── Phone branch ────────────────────────────────── */}
          {channel === 'phone' && (
            <>
              <div
                className="rounded-md border p-3 flex items-center justify-between"
                style={{
                  borderColor: 'var(--border-soft)',
                  background: 'var(--surface-sunken)',
                }}
              >
                <div>
                  <p
                    className="text-[11.5px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Phone number on file
                  </p>
                  <p
                    className="text-[15px] font-mono tabular-nums mt-0.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {client.phone ?? 'No phone on file'}
                  </p>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="topup-call-notes" className="text-[13px]">
                  Call notes
                </Label>
                <Textarea
                  id="topup-call-notes"
                  rows={5}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="What did they say? Agreed amount, timing, follow-up needed…"
                />
              </div>
            </>
          )}

          {/* ── In-person branch ────────────────────────────── */}
          {channel === 'in_person' && (
            <div className="grid gap-1.5">
              <Label htmlFor="topup-inperson-notes" className="text-[13px]">
                Meeting notes{' '}
                <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </Label>
              <Textarea
                id="topup-inperson-notes"
                rows={5}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Recap what was agreed in person so the audit trail is complete."
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {channel === 'email' && (
            <>
              <Button variant="outline" onClick={handleCopyEmail}>
                <Copy size={13} strokeWidth={1.75} />
                Copy
              </Button>
              <Button
                onClick={handleSendEmail}
                style={{ background: 'var(--gold)', color: 'var(--navy)' }}
              >
                <Mail size={13} strokeWidth={1.75} />
                Open in mail
              </Button>
            </>
          )}
          {channel === 'phone' && (
            <Button
              onClick={handleOpenDialer}
              style={{ background: 'var(--gold)', color: 'var(--navy)' }}
            >
              <Phone size={13} strokeWidth={1.75} />
              Open dialer & log
            </Button>
          )}
          {channel === 'in_person' && (
            <Button
              onClick={handleLogInPerson}
              style={{ background: 'var(--gold)', color: 'var(--navy)' }}
            >
              <Check size={13} strokeWidth={1.75} />
              Log request
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BalanceCell({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div>
      <p
        className="text-[11.5px] font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        <Bell size={11} strokeWidth={1.75} />
        {label}
      </p>
      <p
        className="text-[15px] font-semibold tabular-nums mt-0.5"
        style={{ color: accent }}
      >
        {value}
      </p>
    </div>
  )
}
