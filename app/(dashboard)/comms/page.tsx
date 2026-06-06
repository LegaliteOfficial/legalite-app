'use client'

import { useState, useCallback } from 'react'
import { MessageSquare, Plus, Mail, Phone, Send, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Spinner } from '@/components/shared/Spinner'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { useClients } from '@/hooks/use-clients'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  CreateMessageMutationDoc,
  DeleteMessageMutationDoc,
  MessagesQueryDoc,
} from '@/lib/graphql/comms'
import { toast } from 'sonner'

type ChannelFilter = 'all' | 'email' | 'sms' | 'whatsapp' | 'in_app'

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  sms: Phone,
  whatsapp: MessageSquare,
  in_app: Send,
}

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  in_app: 'In-app',
}

export default function CommsPage() {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    subject: '',
    body: '',
    channel: 'email',
    direction: 'outbound',
    status: 'draft',
  })

  const { data: clients } = useClients()

  const { data: messagesData, loading: isLoading } = useQuery(MessagesQueryDoc, {
    variables: {
      clientId: null,
      channel: channelFilter === 'all' ? null : channelFilter,
    },
  })
  const messages = messagesData?.messages

  const [createMessage, createState] = useMutation(CreateMessageMutationDoc, {
    refetchQueries: [MessagesQueryDoc],
    onCompleted: () => {
      resetForm()
      toast.success('Message created successfully.')
    },
  })

  const [deleteMessage] = useMutation(DeleteMessageMutationDoc, {
    refetchQueries: [MessagesQueryDoc],
    onCompleted: () => toast.success('Message removed.'),
  })

  const createMutation = {
    isPending: createState.loading,
    mutate: (data: typeof form) => {
      void createMessage({ variables: { input: data } })
    },
  }
  const deleteMutation = {
    mutate: (id: string) => {
      void deleteMessage({ variables: { id } })
    },
  }

  const resetForm = useCallback(() => {
    setForm({ client_id: '', subject: '', body: '', channel: 'email', direction: 'outbound', status: 'draft' })
    setShowForm(false)
  }, [])

  const filtered = (messages ?? []).filter((m) =>
    !search ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    (m.client_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <PageSkeleton />

  const channels: { id: ChannelFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'email', label: 'Email' },
    { id: 'sms', label: 'SMS' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'in_app', label: 'In-app' },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Communications"
          description={`${messages?.length ?? 0} message${messages?.length === 1 ? '' : 's'}`}
          actions={
            <>
              <div className="relative w-56">
                <Search
                  size={14}
                  strokeWidth={1.75}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-subtle)' }}
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages…"
                  className="pl-9 h-9 text-[13px] rounded-lg"
                  style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
                />
              </div>
              <Button onClick={() => setShowForm(true)} size="lg" className="rounded-lg">
                <Plus size={14} strokeWidth={2} />
                New message
              </Button>
            </>
          }
        />

        <div className="mt-6 flex items-center gap-1">
          {channels.map((ch) => {
            const isActive = channelFilter === ch.id
            return (
              <button
                key={ch.id}
                onClick={() => setChannelFilter(ch.id)}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
                style={{
                  background: isActive ? 'var(--surface-sunken)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                {ch.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          {!filtered.length ? (
            <div
              className="rounded-2xl border px-6 py-16 text-center"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-soft)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'var(--surface-sunken)' }}
              >
                <MessageSquare size={18} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                No messages found
              </p>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Click &quot;New message&quot; to start a conversation.
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-soft)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <ul className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                {filtered.map((msg) => {
                  const Icon = CHANNEL_ICONS[msg.channel] ?? Mail
                  return (
                    <li
                      key={msg.id}
                      className="group flex items-start gap-4 px-5 py-3.5 transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-overlay)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--surface-sunken)' }}
                      >
                        <Icon size={14} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3
                            className="text-[13.5px] font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {msg.subject}
                          </h3>
                          <StatusBadge status={msg.status} />
                          <span
                            className="text-[10.5px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
                            style={{
                              background: 'var(--surface-sunken)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {CHANNEL_LABELS[msg.channel] ?? msg.channel}
                          </span>
                        </div>
                        <p
                          className="text-[12.5px] truncate mb-1"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {msg.body}
                        </p>
                        <div
                          className="flex items-center gap-2 text-[11px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <span>{msg.client_name ?? 'Unknown client'}</span>
                          <span>·</span>
                          <span>{msg.direction === 'outbound' ? 'Sent' : 'Received'}</span>
                          <span>·</span>
                          <span className="tabular-nums">
                            {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteMutation.mutate(msg.id)}
                          aria-label="Delete message"
                        >
                          <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm() }}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg" style={{ color: 'var(--text-primary)' }}>
                New message
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Field label="Client">
                <Select value={form.client_id} onValueChange={(v) => setForm((p) => ({ ...p, client_id: v ?? '' }))}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {(clients ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span>{c.full_name}</span>
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {c.email ?? c.phone ?? ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {form.client_id && (() => {
                const selected = (clients ?? []).find((c) => c.id === form.client_id)
                if (!selected) return null
                return (
                  <div
                    className="rounded-xl px-3 py-2.5 flex items-center gap-3"
                    style={{ background: 'var(--surface-sunken)' }}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-semibold"
                      style={{
                        background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
                        color: 'var(--navy)',
                      }}
                    >
                      {(selected.full_name ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {selected.full_name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {selected.email && <span className="flex items-center gap-1"><Mail size={9} /> {selected.email}</span>}
                        {selected.phone && <span className="flex items-center gap-1"><Phone size={9} /> {selected.phone}</span>}
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Channel">
                  <Select value={form.channel} onValueChange={(v) => setForm((p) => ({ ...p, channel: v ?? '' }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="in_app">In-app</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v ?? '' }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Subject">
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Message subject"
                  className="h-10"
                />
              </Field>

              <Field label="Message">
                <Textarea
                  value={form.body}
                  onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Type your message…"
                  rows={4}
                />
              </Field>
            </div>
            <DialogFooter className="pt-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.client_id || !form.subject || !form.body}
              >
                {createMutation.isPending ? <><Spinner size={14} /> Sending…</> : 'Send'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label
        className="text-[11px] font-medium uppercase tracking-wider mb-1.5 block"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </Label>
      {children}
    </div>
  )
}
