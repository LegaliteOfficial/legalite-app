'use client'

/**
 * Compose a message to a client across any supported channel.
 *
 * Shared by the contact's Communications tab (client fixed) and the
 * firm-wide Client comms tab (client picked), so the two surfaces cannot
 * drift in what a message is or which channels exist.
 *
 * What "send" means differs by channel, and the dialog says so rather
 * than implying one behaviour:
 *
 *   email / sms / in_app — recorded, and delivered by the backend when
 *                          that service exists.
 *   whatsapp            — recorded, then WhatsApp opens with the text
 *                         prefilled. The user still presses send there,
 *                         and the reply never comes back to us, so this
 *                         is logged as a conversation opened.
 */

import { useEffect, useState } from 'react'
import { ChatCircle, Envelope, PaperPlaneTilt, Phone } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useMutation } from '@apollo/client/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreateMessageMutationDoc, MessagesQueryDoc } from '@/lib/graphql/comms'
import { buildWhatsAppUrl, normalisePhone } from '@/lib/contact-channels'

export type MessageChannel = 'email' | 'sms' | 'whatsapp' | 'in_app'

const CHANNELS: {
  id: MessageChannel
  label: string
  Icon: typeof Envelope
  /** Shown under the composer so the behaviour is never a surprise. */
  note: string
  needs: 'email' | 'phone' | null
}[] = [
  {
    id: 'email',
    label: 'Email',
    Icon: Envelope,
    note: 'Recorded against the client and sent by email.',
    needs: 'email',
  },
  {
    id: 'sms',
    label: 'SMS',
    Icon: Phone,
    note: 'Recorded against the client and sent as a text message.',
    needs: 'phone',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    Icon: ChatCircle,
    note: 'Recorded, then WhatsApp opens with this text ready to send. Replies stay in WhatsApp.',
    needs: 'phone',
  },
  {
    id: 'in_app',
    label: 'In-app',
    Icon: PaperPlaneTilt,
    note: 'Delivered in the client portal inbox.',
    needs: null,
  },
]

export interface MessageRecipient {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

export function NewMessageDialog({
  open,
  onOpenChange,
  recipient,
  recipients,
  defaultChannel = 'email',
  onSent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Fixed recipient — the contact whose page we are on. */
  recipient?: MessageRecipient
  /** Pickable recipients, when composing from the firm-wide view. */
  recipients?: MessageRecipient[]
  defaultChannel?: MessageChannel
  onSent?: () => void
}) {
  const [channel, setChannel] = useState<MessageChannel>(defaultChannel)
  const [clientId, setClientId] = useState(recipient?.id ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const [createMessage, { loading }] = useMutation(CreateMessageMutationDoc, {
    refetchQueries: [MessagesQueryDoc],
  })

  // Reset per opening so a previous draft is never sent by accident.
  useEffect(() => {
    if (!open) return
    setChannel(defaultChannel)
    setClientId(recipient?.id ?? '')
    setSubject('')
    setBody('')
  }, [open, defaultChannel, recipient?.id])

  const meta = CHANNELS.find((c) => c.id === channel)!
  const target =
    recipient ?? recipients?.find((r) => r.id === clientId) ?? undefined

  // A channel the recipient cannot receive on is a dead end; say which.
  const missing =
    target && meta.needs === 'email' && !target.email?.trim()
      ? 'This contact has no email address.'
      : target && meta.needs === 'phone' && !normalisePhone(target.phone)
        ? 'This contact has no usable phone number.'
        : null

  const canSend = Boolean(clientId && body.trim() && !missing && !loading)

  const handleSend = async () => {
    if (!canSend) return
    try {
      await createMessage({
        variables: {
          input: {
            client_id: clientId,
            subject: subject.trim(),
            body: body.trim(),
            channel,
            direction: 'outbound',
            status: channel === 'whatsapp' ? 'opened' : 'sent',
          },
        },
      })

      // WhatsApp is a handoff: the record is ours, the conversation is not.
      if (channel === 'whatsapp' && target) {
        const url = buildWhatsAppUrl(target.phone, body.trim())
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
        toast.success('Logged. WhatsApp is opening with your message ready.')
      } else {
        toast.success('Message recorded.')
      }

      onSent?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not record the message.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">
            {recipient ? `New message to ${recipient.name}` : 'New message'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {/* Recipient — only when not already fixed by the page. */}
          {!recipient && (
            <div className="grid gap-1.5">
              <Label className="text-[12.5px]">Client</Label>
              <Select value={clientId} onValueChange={(v) => setClientId(v ?? '')}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {(recipients ?? []).map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-[13px]">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label className="text-[12.5px]">Channel</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CHANNELS.map(({ id, label, Icon }) => {
                const active = channel === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setChannel(id)}
                    className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[12.5px] font-medium transition-colors"
                    style={{
                      borderColor: active ? 'var(--gold)' : 'var(--border-soft)',
                      background: active
                        ? 'rgba(201,151,43,0.08)'
                        : 'var(--surface-card)',
                      color: active
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                    }}
                  >
                    <Icon size={13} strokeWidth={1.75} />
                    {label}
                  </button>
                )
              })}
            </div>
            <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
              {meta.note}
            </p>
          </div>

          {channel === 'email' && (
            <div className="grid gap-1.5">
              <Label htmlFor="nm-subject" className="text-[12.5px]">
                Subject
              </Label>
              <Input
                id="nm-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What is this about?"
                className="h-9 text-[13px]"
              />
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="nm-body" className="text-[12.5px]">
              Message
            </Label>
            <Textarea
              id="nm-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Write your message…"
              className="text-[13px]"
            />
          </div>

          {missing && (
            <p className="text-[12px]" style={{ color: '#C0392B' }}>
              {missing}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canSend} onClick={handleSend}>
            {loading
              ? 'Saving…'
              : channel === 'whatsapp'
                ? 'Log and open WhatsApp'
                : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
