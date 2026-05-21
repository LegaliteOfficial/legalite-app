'use client'

import ReactMarkdown from 'react-markdown'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Sparkles, Send, Scale, BookOpen, Search, Loader2, Plus, MessageSquare, Trash2, Clock, Copy, Check, PanelLeftClose, PanelLeft, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Attachment {
  name: string
  mime_type: string
  size: number
  data: string // base64-encoded
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10MB
const ACCEPTED_MIME_PREFIXES = ['application/pdf', 'text/', 'image/', 'application/vnd.openxmlformats-officedocument', 'application/msword']

interface Source {
  id: string
  title: string
  content: string
  similarity: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ConversationWithMessages extends Conversation {
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    sources: Source[]
    created_at: string
  }>
}

interface AiChatResponse {
  success: boolean
  data: {
    response: string
    sources: Source[]
    conversation_id?: string
  }
}

interface ConversationsResponse {
  success: boolean
  data: Conversation[]
}

interface ConversationResponse {
  success: boolean
  data: ConversationWithMessages
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const res = await api.get<ConversationsResponse>('/ai/conversations')
      setConversations(res.data.data)
    } catch {
      // Silent fail on first load
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await api.get<ConversationResponse>(`/ai/conversations/${id}`)
      const conv = res.data.data
      setActiveConversationId(id)
      setMessages(
        conv.messages.map((m) => ({
          role: m.role,
          content: m.content,
          sources: m.sources,
        }))
      )
    } catch {
      toast.error('Unable to load conversation.')
    }
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.delete(`/ai/conversations/${id}`)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeConversationId === id) {
        setActiveConversationId(null)
        setMessages([])
      }
      toast.success('Conversation deleted.')
    } catch {
      toast.error('Unable to delete conversation.')
    }
  }, [activeConversationId])

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null)
    setMessages([])
    setInput('')
  }, [])

  const handleCopy = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    } catch {
      toast.error('Unable to copy to clipboard.')
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [])

  const handleSend = useCallback(async () => {
    const message = input.trim()
    if (!message || isLoading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setIsLoading(true)
    scrollToBottom()

    const sentAttachments = attachments
    setAttachments([])

    try {
      const payload: {
        message: string
        conversation_id?: string
        attachments?: Array<{ name: string; mime_type: string; data: string }>
      } = { message }
      if (activeConversationId) {
        payload.conversation_id = activeConversationId
      }
      if (sentAttachments.length > 0) {
        payload.attachments = sentAttachments.map((a) => ({
          name: a.name,
          mime_type: a.mime_type,
          data: a.data,
        }))
      }

      const res = await api.post<AiChatResponse>('/ai/chat', payload)
      const { response, sources, conversation_id } = res.data.data
      setMessages((prev) => [...prev, { role: 'assistant', content: response, sources }])

      // Track conversation ID
      if (conversation_id && !activeConversationId) {
        setActiveConversationId(conversation_id)
        // Reload conversation list
        loadConversations()
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I was unable to process your request. Please try again.',
      }])
      toast.error('AI request failed. Please try again.')
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }, [input, isLoading, scrollToBottom, activeConversationId, attachments])

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFilesSelected = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newAttachments: Attachment[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name} is larger than 10MB and cannot be attached.`)
        continue
      }
      const accepted = ACCEPTED_MIME_PREFIXES.some((p) => file.type.startsWith(p))
      if (!accepted) {
        toast.error(`${file.name} has an unsupported file type.`)
        continue
      }

      try {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Strip the data:<mime>;base64, prefix
            const base64 = result.split(',')[1] ?? ''
            resolve(base64)
          }
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsDataURL(file)
        })

        newAttachments.push({
          name: file.name,
          mime_type: file.type || 'application/octet-stream',
          size: file.size,
          data,
        })
      } catch {
        toast.error(`Failed to read ${file.name}.`)
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments])
      toast.success(`Added ${newAttachments.length} file(s).`)
    }

    // Reset the input so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const removeAttachment = useCallback((idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const suggestions = [
    { icon: Scale, text: 'What are the grounds for judicial review in Ghana?' },
    { icon: BookOpen, text: 'Summarize the Matrimonial Causes Act provisions on divorce' },
    { icon: Search, text: 'Find precedents on breach of contract in commercial disputes' },
  ]

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Conversation Sidebar */}
      {sidebarOpen && (
      <div
        className="w-64 shrink-0 border-r flex flex-col"
        style={{
          borderColor: 'var(--border-soft)',
          background: 'var(--surface-card)',
        }}
      >
        <div className="p-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <Button
            onClick={startNewConversation}
            size="lg"
            className="w-full rounded-lg"
          >
            <Plus size={14} strokeWidth={2} />
            New conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loadingConversations ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--surface-sunken)' }} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-4">
              <MessageSquare size={18} strokeWidth={1.75} className="mx-auto mb-2" style={{ color: 'var(--text-subtle)' }} />
              <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversationId === conv.id
              return (
                <div
                  key={conv.id}
                  className="group flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: isActive ? 'var(--surface-sunken)' : 'transparent',
                  }}
                  onClick={() => loadConversation(conv.id)}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <MessageSquare
                    size={13}
                    strokeWidth={1.75}
                    className="mt-0.5 shrink-0"
                    style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {conv.title}
                    </p>
                    <p className="text-[10.5px] flex items-center gap-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={9} strokeWidth={1.75} />
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                    className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded flex items-center justify-center transition-all"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={11} strokeWidth={1.75} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--surface-card)' }}>
        {/* Header */}
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="h-8 w-8 rounded-lg flex items-center justify-center border transition-colors"
              style={{
                borderColor: 'var(--border-default)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose size={14} strokeWidth={1.75} /> : <PanelLeft size={14} strokeWidth={1.75} />}
            </button>
            <h1
              className="font-heading text-lg font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              LegaLite AI
            </h1>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
              <div className="h-14 w-14 rounded-2xl overflow-hidden flex items-center justify-center mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/favicon.ico" alt="LegaLite" className="h-14 w-14 object-cover" />
              </div>
              <h2
                className="font-heading text-[22px] font-semibold mb-2 tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                How can I help you today?
              </h2>
              <p className="text-[13.5px] mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Ask about Ghana law, find case precedents, or get help drafting legal arguments.
              </p>
              <div className="w-full space-y-2">
                {suggestions.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={i}
                      onClick={() => { setInput(s.text) }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[13px] transition-colors"
                      style={{
                        background: 'var(--surface-card)',
                        borderColor: 'var(--border-soft)',
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--shadow-xs)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-card)')}
                    >
                      <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                      {s.text}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[85%] rounded-2xl px-5 py-3"
                    style={msg.role === 'user' ? {
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-primary)',
                    } : {
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-soft)',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div className="text-sm leading-relaxed ai-markdown">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
                          Sources ({msg.sources.length})
                        </p>
                        <div className="space-y-1.5">
                          {msg.sources.slice(0, 5).map((src, j) => (
                            <div key={j} className="flex items-start gap-2 text-[11px] leading-relaxed" style={{ color: '#6B7280' }}>
                              <BookOpen size={11} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--gold)' }} />
                              <span>
                                <strong>{src.title}</strong>
                                {src.similarity && ` (${Math.round(src.similarity * 100)}% match)`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Copy button for assistant messages */}
                    {msg.role === 'assistant' && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleCopy(msg.content, i)}
                          className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md transition-all hover:bg-gray-50"
                          style={{ color: copiedIdx === i ? '#2E7D4F' : '#9CA3AF' }}
                        >
                          {copiedIdx === i ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-5 py-3 flex items-center gap-2"
                    style={{
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-soft)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <Loader2 size={13} className="animate-spin" style={{ color: 'var(--gold)' }} />
                    <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Legaliting…</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          {/* Attached file chips */}
          {attachments.length > 0 && (
            <div className="max-w-3xl mx-auto mb-2 flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11.5px]"
                  style={{
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border-soft)',
                  }}
                >
                  <FileText size={12} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
                  <span className="font-medium max-w-[180px] truncate" style={{ color: 'var(--text-primary)' }}>
                    {att.name}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatFileSize(att.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="ml-0.5 p-0.5 rounded hover:bg-black/5 transition-colors"
                    aria-label={`Remove ${att.name}`}
                  >
                    <X size={11} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="max-w-3xl mx-auto flex items-end gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.txt,.md,.doc,.docx,image/*"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={isLoading}
              className="h-11 w-11 shrink-0 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.background = 'var(--surface-overlay)'
              }}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label="Attach document"
              title="Attach a document to enrich this answer"
            >
              <Plus size={16} strokeWidth={1.75} />
            </button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask LegaLite anything…"
              rows={1}
              className="resize-none min-h-[44px] max-h-[120px]"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon-lg"
              className="h-11 w-11 shrink-0"
            >
              <Send size={15} strokeWidth={1.75} />
            </Button>
          </div>
          <p className="text-center text-[10.5px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Attach documents (PDF, text, image, DOCX) to combine them with LegaLite AI&apos;s legal knowledge.
          </p>
        </div>
      </div>
    </div>
  )
}
