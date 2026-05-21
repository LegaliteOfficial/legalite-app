'use client'

import { useState, useCallback } from 'react'
import { MessageSquare, Plus, Mail, Phone, Send, Trash2, Pencil, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Spinner } from '@/components/shared/Spinner'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useClients } from '@/hooks/use-clients'
import { api } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Message {
  id: string
  client_id: string
  subject: string
  body: string
  channel: string
  direction: string
  status: string
  client_name: string | null
  created_at: string
}

interface ApiResponse<T> { success: boolean; data: T }

type ChannelFilter = 'all' | 'email' | 'sms' | 'whatsapp' | 'in_app'

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  sms: Phone,
  whatsapp: MessageSquare,
  in_app: Send,
}

const CHANNEL_COLORS: Record<string, string> = {
  email: '#2563EB',
  sms: '#2E7D4F',
  whatsapp: '#25D366',
  in_app: '#C9972B',
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

  const qc = useQueryClient()
  const { data: clients } = useClients()

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['comms', channelFilter],
    queryFn: async () => {
      const params = channelFilter !== 'all' ? `?channel=${channelFilter}` : ''
      const res = await api.get<ApiResponse<Message[]>>(`/comms${params}`)
      return res.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post<ApiResponse<Message>>('/comms', data)
      return res.data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comms'] }); resetForm(); toast.success('Message created successfully.') },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/comms/${id}`) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comms'] }); toast.success('Message removed.') },
  })

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
    { id: 'in_app', label: 'In-App' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-bold" style={{ color: 'var(--navy)' }}>Client Communications</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{messages?.length ?? 0} messages</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages..." className="pl-9 h-10" />
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="h-10 px-5 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, var(--gold), #B8860B)' }}
          >
            <Plus size={16} className="mr-1.5" />
            New Message
          </Button>
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {channels.map((ch) => {
          const isActive = channelFilter === ch.id
          return (
            <button
              key={ch.id}
              onClick={() => setChannelFilter(ch.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive ? 'var(--navy)' : 'white',
                color: isActive ? 'white' : '#374151',
                border: `1px solid ${isActive ? 'var(--navy)' : 'var(--border)'}`,
              }}
            >
              {ch.label}
            </button>
          )
        })}
      </div>

      {/* Messages List */}
      {!filtered.length ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'white', borderColor: 'var(--border)' }}>
          <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No messages found.</p>
          <p className="text-[12px] mt-1" style={{ color: '#9CA3AF' }}>Click &quot;New Message&quot; to start a conversation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => {
            const Icon = CHANNEL_ICONS[msg.channel] ?? Mail
            const color = CHANNEL_COLORS[msg.channel] ?? '#6B7280'
            return (
              <div
                key={msg.id}
                className="group rounded-xl border p-4 flex items-start gap-4 transition-all hover:shadow-sm"
                style={{ background: 'white', borderColor: 'var(--border)' }}
              >
                <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}10` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-heading text-sm font-bold truncate" style={{ color: 'var(--navy)' }}>{msg.subject}</h3>
                    <StatusBadge status={msg.status} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: `${color}10`, color }}>
                      {msg.channel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] truncate mb-1" style={{ color: '#6B7280' }}>{msg.body}</p>
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: '#9CA3AF' }}>
                    <span>{msg.client_name ?? 'Unknown client'}</span>
                    <span>&middot;</span>
                    <span>{msg.direction === 'outbound' ? 'Sent' : 'Received'}</span>
                    <span>&middot;</span>
                    <span>{new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteMutation.mutate(msg.id)}>
                    <Trash2 size={13} className="text-red-400" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Message Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg" style={{ color: 'var(--navy)' }}>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Client *</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm((p) => ({ ...p, client_id: v ?? '' }))}>
                <SelectTrigger className="h-10"><SelectValue placeholder="-- Select client --" /></SelectTrigger>
                <SelectContent>
                  {(clients ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.full_name}</span>
                        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
                          {c.email ?? c.phone ?? ''}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.client_id && (() => {
              const selected = (clients ?? []).find((c) => c.id === form.client_id)
              if (!selected) return null
              return (
                <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: 'rgba(201,151,43,0.04)', border: '1px solid rgba(201,151,43,0.15)' }}>
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: 'var(--navy)' }}>
                    {(selected.full_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>{selected.full_name}</p>
                    <div className="flex items-center gap-3 text-[10px]" style={{ color: '#6B7280' }}>
                      {selected.email && <span className="flex items-center gap-1"><Mail size={9} /> {selected.email}</span>}
                      {selected.phone && <span className="flex items-center gap-1"><Phone size={9} /> {selected.phone}</span>}
                    </div>
                  </div>
                </div>
              )
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm((p) => ({ ...p, channel: v ?? '' }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="in_app">In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v ?? '' }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Message subject" className="h-10" />
            </div>
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Message *</Label>
              <Textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder="Type your message..." rows={4} />
            </div>
          </div>
          <DialogFooter className="rounded-b-2xl pt-3" style={{ background: 'rgba(13,27,42,0.02)' }}>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.client_id || !form.subject || !form.body}
              className="text-white"
              style={{ background: 'var(--gold)' }}
            >
              {createMutation.isPending ? <><Spinner size={14} /> Sending...</> : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
