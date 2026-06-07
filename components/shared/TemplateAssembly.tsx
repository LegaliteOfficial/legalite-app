'use client'

/**
 * TemplateAssembly
 * ----------------
 * Case-driven document assembly view for the Documents page.
 *
 * Workflow:
 *   1. Lawyer types a client name -> typeahead shows matching clients
 *   2. Lawyer picks a client -> that client's cases appear as cards
 *   3. Lawyer picks a case -> court / suit number / parties auto-fill
 *      from the case (with "from case" gold badges)
 *   4. Lawyer fills the per-document fields (grounds, reliefs, etc.)
 *   5. Live preview pane on the right updates on every keystroke
 *   6. Save to Library / Export / Print actions persist the doc and link
 *      it to the case
 *
 * Override invariant:
 *   When the lawyer manually edits an auto-filled field, that field key
 *   is added to `userOverrides`. Subsequent case-change events skip those
 *   keys so the lawyer never loses typed work.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { MagnifyingGlass, Check, ArrowCounterClockwise, WarningCircle, ArrowLeft, DownloadSimple, Printer, Sparkle, TextB, TextItalic, TextUnderline, TextStrikethrough, TextHOne, TextHTwo, TextHThree, List, ListNumbers, TextAlignLeft, TextAlignCenter, TextAlignRight, TextAlignJustify, Paragraph, FileText, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/shared/Spinner'
import { useClients } from '@/hooks/use-clients'
import { useCases } from '@/hooks/use-cases'
import { useCreateDocument } from '@/hooks/use-documents'
import {
  GHANA_COURTS,
  generateDocumentContent,
  generateDocumentHTML,
  type DocumentTemplate,
  type CaseContext,
} from '@/lib/templates'
import type { Client, Case } from '@/types'
import { toast } from 'sonner'

interface TemplateAssemblyProps {
  template: DocumentTemplate
  onBack: () => void
  /** Called when the document is successfully saved to library. */
  onSaved?: () => void
}

const CATEGORY_COLORS: Record<string, { bg: string; accent: string }> = {
  litigation: { bg: 'rgba(37,99,235,0.06)', accent: '#2563EB' },
  criminal: { bg: 'rgba(192,57,43,0.06)', accent: '#C0392B' },
  family: { bg: 'rgba(139,92,246,0.06)', accent: '#8B5CF6' },
  corporate: { bg: 'rgba(46,125,79,0.06)', accent: '#2E7D4F' },
  conveyancing: { bg: 'rgba(201,151,43,0.06)', accent: '#C9972B' },
}

/**
 * Build the CaseContext object passed to caseFieldMap functions.
 * Plain transform; no async work.
 */
function buildCaseContext(client: Client, kase: Case): CaseContext {
  return {
    client: {
      full_name: client.full_name ?? '',
      email: client.email,
      phone: client.phone,
      address: client.address,
      ghana_card: client.ghana_card,
    },
    case: {
      title: kase.title ?? '',
      court: kase.court,
      suit_number: kase.suit_number,
      opposing_party: kase.opposing_party,
      case_type: kase.case_type,
      next_court_date: kase.next_court_date,
      notes: kase.notes,
    },
  }
}

export function TemplateAssembly({ template, onBack, onSaved }: TemplateAssemblyProps) {
  // ── Pickers ────────────────────────────────────────────────────────────
  const [clientQuery, setClientQuery] = useState('')
  const [showClientList, setShowClientList] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)

  // ── Form fields ────────────────────────────────────────────────────────
  // The "shell" fields (court, suit number, draft title) live alongside
  // the per-template fields in a single record so the override-tracking
  // logic is uniform.
  type FieldKey = 'draft_title' | 'court' | 'suit_number' | string
  const [fields, setFields] = useState<Record<FieldKey, string>>({
    draft_title: '',
    court: '',
    suit_number: '',
  })
  const [userOverrides, setUserOverrides] = useState<Set<FieldKey>>(new Set())

  // ── Editor / preview ──────────────────────────────────────────────────
  const editorRef = useRef<HTMLDivElement>(null)
  const [editorHTML, setEditorHTML] = useState('')

  /** Keep the contentEditable div in sync when fields change auto-fill the HTML. */
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== editorHTML) {
      editorRef.current.innerHTML = editorHTML
    }
  }, [editorHTML])

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }, [])

  // ── Data ──────────────────────────────────────────────────────────────
  const { data: clients, isLoading: clientsLoading } = useClients()
  const { data: cases } = useCases()
  const createMutation = useCreateDocument()

  // ── Derived: client search results ────────────────────────────────────
  const matchingClients = useMemo(() => {
    if (!clients) return [] as Client[]
    const q = clientQuery.trim().toLowerCase()
    if (!q) return clients.slice(0, 8)
    return clients
      .filter((c) =>
        (c.full_name ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [clients, clientQuery])

  // ── Derived: cases for selected client ────────────────────────────────
  const clientCases = useMemo(() => {
    if (!selectedClient || !cases) return [] as Case[]
    return cases.filter((c) => c.client_id === selectedClient.id)
  }, [selectedClient, cases])

  // ── Auto-fill effect: when case changes, populate non-overridden fields ─
  // ── This is the override invariant in action. ──────────────────────────
  useEffect(() => {
    if (!selectedClient || !selectedCase) return

    const ctx = buildCaseContext(selectedClient, selectedCase)
    const next: Record<string, string> = {}

    // Shell fields
    if (!userOverrides.has('court') && ctx.case.court) next.court = ctx.case.court
    if (!userOverrides.has('suit_number') && ctx.case.suit_number) next.suit_number = ctx.case.suit_number
    if (!userOverrides.has('draft_title')) {
      next.draft_title = `${template.name} — ${ctx.case.title || ctx.client.full_name}`
    }

    // Template-specific auto-fillable fields
    if (template.caseFieldMap) {
      for (const [key, fn] of Object.entries(template.caseFieldMap)) {
        if (!userOverrides.has(key)) {
          const value = fn(ctx)
          if (value) next[key] = value
        }
      }
    }

    if (Object.keys(next).length > 0) {
      setFields((prev) => ({ ...prev, ...next }))
    }
    // We intentionally exclude `userOverrides` from deps — we want re-fill
    // only when the *case* or *template* changes, not on every override toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient, selectedCase, template])

  // ── Live preview: regenerate on any field change ──────────────────────
  useEffect(() => {
    const html = generateDocumentHTML(
      template.id,
      fields.court || '',
      fields.suit_number || '',
      fields.draft_title || '',
      fields,
    )
    setEditorHTML(html)
  }, [template.id, fields])

  // ── Field handlers ────────────────────────────────────────────────────
  const setField = useCallback((key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    setUserOverrides((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const resetField = useCallback((key: string) => {
    if (!selectedClient || !selectedCase) return
    const ctx = buildCaseContext(selectedClient, selectedCase)
    let value = ''
    if (key === 'court') value = ctx.case.court ?? ''
    else if (key === 'suit_number') value = ctx.case.suit_number ?? ''
    else if (key === 'draft_title') value = `${template.name} — ${ctx.case.title || ctx.client.full_name}`
    else if (template.caseFieldMap?.[key]) value = template.caseFieldMap[key](ctx)
    setFields((prev) => ({ ...prev, [key]: value }))
    setUserOverrides((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [selectedClient, selectedCase, template])

  // ── Helpers to know if a field is auto-filled (and not overridden) ────
  const autoFilledKeys = useMemo(() => {
    if (!selectedCase) return new Set<string>()
    const keys = new Set<string>()
    if (selectedCase.court) keys.add('court')
    if (selectedCase.suit_number) keys.add('suit_number')
    keys.add('draft_title')
    if (template.caseFieldMap) {
      for (const k of Object.keys(template.caseFieldMap)) keys.add(k)
    }
    return keys
  }, [selectedCase, template])

  const isAutoFilled = (key: string) => autoFilledKeys.has(key) && !userOverrides.has(key)

  // ── Pick handlers ─────────────────────────────────────────────────────
  const pickClient = useCallback((client: Client) => {
    setSelectedClient(client)
    setClientQuery(client.full_name ?? '')
    setShowClientList(false)
    // If only one case, auto-pick it
    const hisCases = (cases ?? []).filter((c) => c.client_id === client.id)
    if (hisCases.length === 1) {
      setSelectedCase(hisCases[0])
    } else {
      setSelectedCase(null)
    }
  }, [cases])

  const clearClient = useCallback(() => {
    setSelectedClient(null)
    setSelectedCase(null)
    setClientQuery('')
    setShowClientList(false)
    setUserOverrides(new Set())
    setFields({ draft_title: '', court: '', suit_number: '' })
  }, [])

  // ── Document actions ──────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!fields.draft_title) {
      toast.error('Please enter a draft title.')
      return
    }
    const content = generateDocumentContent(
      template.id,
      fields.court || '',
      fields.suit_number || '',
      fields.draft_title,
      fields,
    )
    try {
      await createMutation.mutateAsync({
        title: fields.draft_title,
        template_type: template.name,
        court: fields.court || '',
        suit_number: fields.suit_number || '',
        content,
        client_id: selectedClient?.id,
        case_id: selectedCase?.id,
      })
      toast.success('Document saved to library.')
      onSaved?.()
    } catch {
      toast.error('Unable to save document. Please try again.')
    }
  }, [template, fields, selectedClient, selectedCase, createMutation, onSaved])

  const handleExport = useCallback(() => {
    const content = editorRef.current?.innerText ?? ''
    if (!content.trim()) {
      toast.error('Nothing to export. Pick a client and case first.')
      return
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fields.draft_title || 'document'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Document exported.')
  }, [fields.draft_title])

  const handlePrint = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? ''
    if (!html.trim()) {
      toast.error('Nothing to print. Pick a client and case first.')
      return
    }
    const pw = window.open('', '_blank')
    if (pw) {
      pw.document.write(`<html><head><title>${fields.draft_title || 'Legal Document'}</title><style>body{font-family:'Times New Roman',serif;font-size:14pt;line-height:1.8;padding:60px;max-width:800px;margin:0 auto;}</style></head><body>${html}</body></html>`)
      pw.document.close()
      pw.print()
    }
  }, [fields.draft_title])

  // ── Render ────────────────────────────────────────────────────────────
  const accent = CATEGORY_COLORS[template.category]?.accent ?? '#6B7280'
  const accentBg = CATEGORY_COLORS[template.category]?.bg ?? 'rgba(107,114,128,0.06)'

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium mb-5 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--gold)' }}
      >
        <ArrowLeft size={16} /> Back to Templates
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Assembly panel ─────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-xl border p-6" style={{ background: 'white', borderColor: 'var(--border)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: accentBg }}>
              <FileText size={18} style={{ color: accent }} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--navy)' }}>Quick Setup</h2>
              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{template.name}</p>
            </div>
          </div>

          {/* Step 1: Client picker */}
          <div className="mb-4">
            <Label className="text-[11px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: '#6B7280' }}>
              1. Client *
            </Label>
            {selectedClient ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(46,125,79,0.06)', border: '1px solid rgba(46,125,79,0.2)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: 'var(--navy)' }}>
                    {(selectedClient.full_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--navy)' }}>{selectedClient.full_name}</p>
                    <p className="text-[10px] truncate" style={{ color: '#6B7280' }}>{selectedClient.email ?? selectedClient.phone ?? ''}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearClient}
                  className="p-1 rounded hover:bg-black/5 flex-shrink-0"
                  aria-label="Change client"
                >
                  <X size={13} style={{ color: '#6B7280' }} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  value={clientQuery}
                  onChange={(e) => { setClientQuery(e.target.value); setShowClientList(true) }}
                  onFocus={() => setShowClientList(true)}
                  placeholder="Search clients by name, email, or phone..."
                  className="pl-9 h-10"
                />
                {showClientList && (
                  <div className="absolute left-0 right-0 mt-1 rounded-lg border shadow-lg z-10 max-h-72 overflow-y-auto" style={{ background: 'white', borderColor: 'var(--border)' }}>
                    {clientsLoading ? (
                      <div className="p-3 text-center text-[12px]" style={{ color: '#9CA3AF' }}>Loading clients...</div>
                    ) : matchingClients.length === 0 ? (
                      <div className="p-3 text-center text-[12px]" style={{ color: '#9CA3AF' }}>
                        No clients match &quot;{clientQuery}&quot;.
                      </div>
                    ) : (
                      matchingClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickClient(c)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                          style={{ borderColor: 'rgba(0,0,0,0.04)' }}
                        >
                          <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: 'var(--navy)' }}>
                            {(c.full_name ?? '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--navy)' }}>{c.full_name}</p>
                            <p className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>{c.email ?? c.phone ?? ''}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Case picker */}
          {selectedClient && (
            <div className="mb-4">
              <Label className="text-[11px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: '#6B7280' }}>
                2. Case *
              </Label>
              {clientCases.length === 0 ? (
                <div className="px-3 py-2.5 rounded-lg flex items-start gap-2" style={{ background: 'rgba(192,57,43,0.04)', border: '1px solid rgba(192,57,43,0.15)' }}>
                  <WarningCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#C0392B' }} />
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>No cases for this client.</p>
                    <p className="text-[11px]" style={{ color: '#6B7280' }}>Open a case from the Cases page first.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {clientCases.map((c) => {
                    const isPicked = selectedCase?.id === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCase(c)}
                        className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                        style={{
                          background: isPicked ? 'rgba(201,151,43,0.08)' : 'white',
                          border: '1px solid ' + (isPicked ? 'var(--gold)' : 'var(--border)'),
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--navy)' }}>{c.title}</p>
                            <p className="text-[10px] truncate mt-0.5" style={{ color: '#6B7280' }}>
                              {c.suit_number ?? 'No suit no.'} · {c.court ?? 'No court'}
                            </p>
                          </div>
                          {isPicked && (
                            <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Document fields (only after case picked) */}
          {selectedCase && (
            <>
              <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--border)' }}>
                <p className="text-[11px] font-semibold tracking-wider uppercase mb-3" style={{ color: '#6B7280' }}>
                  3. Document Details
                </p>
              </div>

              {/* Draft title */}
              <FieldRow
                label="Draft Title"
                fieldKey="draft_title"
                value={fields.draft_title}
                onChange={(v) => setField('draft_title', v)}
                onReset={() => resetField('draft_title')}
                isAuto={isAutoFilled('draft_title')}
                isOverridden={userOverrides.has('draft_title')}
              />

              {/* Court */}
              <div className="mb-3">
                <FieldLabel label="Court" isAuto={isAutoFilled('court')} isOverridden={userOverrides.has('court')} onReset={() => resetField('court')} />
                <Select
                  value={fields.court || ''}
                  onValueChange={(v) => setField('court', v ?? '')}
                >
                  <SelectTrigger className="h-10"><SelectValue placeholder="-- Select court --" /></SelectTrigger>
                  <SelectContent>
                    {GHANA_COURTS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
                {!fields.court && <FieldWarning text="Court not set on this case. Pick one or update the case." />}
              </div>

              {/* Suit number */}
              <FieldRow
                label="Suit Number"
                fieldKey="suit_number"
                value={fields.suit_number}
                onChange={(v) => setField('suit_number', v)}
                onReset={() => resetField('suit_number')}
                isAuto={isAutoFilled('suit_number')}
                isOverridden={userOverrides.has('suit_number')}
                placeholder="HC/CR/0042/2025"
                warning={!fields.suit_number ? 'Suit number not set on this case.' : undefined}
              />

              {/* Template-specific fields */}
              <div className="border-t pt-4 mt-3" style={{ borderColor: 'var(--border)' }}>
                <p className="text-[11px] font-semibold tracking-wider uppercase mb-3" style={{ color: '#6B7280' }}>
                  Template Fields
                </p>
              </div>
              {template.fields.map((field) => (
                <FieldRow
                  key={field.key}
                  label={field.label + (field.required ? ' *' : '')}
                  fieldKey={field.key}
                  value={fields[field.key] ?? ''}
                  onChange={(v) => setField(field.key, v)}
                  onReset={() => resetField(field.key)}
                  isAuto={isAutoFilled(field.key)}
                  isOverridden={userOverrides.has(field.key)}
                  placeholder={field.placeholder}
                  textarea={field.type === 'textarea'}
                  inputType={field.type === 'date' ? 'date' : 'text'}
                />
              ))}

              {/* Actions */}
              <div className="border-t pt-4 mt-3" style={{ borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Button variant="outline" onClick={handleExport} className="h-10"><DownloadSimple size={14} className="mr-1.5" /> Export</Button>
                  <Button variant="outline" onClick={handlePrint} className="h-10"><Printer size={14} className="mr-1.5" /> Print</Button>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending}
                  className="w-full h-11 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--gold), #B8860B)' }}
                >
                  {createMutation.isPending ? <><Spinner size={14} /> Saving to Library...</> : 'Save to Library'}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* ── Right: Live preview ─────────────────────────────────────── */}
        <div className="lg:col-span-3 rounded-xl border overflow-hidden" style={{ background: 'white', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--navy)' }}>Preview</h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(201,151,43,0.1)', color: 'var(--gold)' }}>
              <Sparkle size={12} /> Live
            </span>
          </div>
          {/* Rich text toolbar — execCommand is deprecated but preserves the
              custom HTML formatting from generateDocumentHTML pixel-for-pixel,
              which TipTap's strict schema strips. */}
          <div className="flex items-center gap-0.5 px-3 py-2 border-b flex-wrap" style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.02)' }}>
            <ToolbarBtn onClick={() => execCommand('bold')} title="Bold (Cmd/Ctrl+B)"><TextB size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('italic')} title="Italic (Cmd/Ctrl+I)"><TextItalic size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('underline')} title="Underline (Cmd/Ctrl+U)"><TextUnderline size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('strikeThrough')} title="Strikethrough"><TextStrikethrough size={14} /></ToolbarBtn>
            <ToolbarDiv />
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'p')} title="Paragraph"><Paragraph size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'h1')} title="Heading 1"><TextHOne size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'h2')} title="Heading 2"><TextHTwo size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('formatBlock', 'h3')} title="Heading 3"><TextHThree size={14} /></ToolbarBtn>
            <ToolbarDiv />
            <ToolbarBtn onClick={() => execCommand('insertUnorderedList')} title="Bullet list"><List size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('insertOrderedList')} title="Numbered list"><ListNumbers size={14} /></ToolbarBtn>
            <ToolbarDiv />
            <ToolbarBtn onClick={() => execCommand('justifyLeft')} title="Align left"><TextAlignLeft size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('justifyCenter')} title="Align center"><TextAlignCenter size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('justifyRight')} title="Align right"><TextAlignRight size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={() => execCommand('justifyFull')} title="Justify"><TextAlignJustify size={14} /></ToolbarBtn>
          </div>
          <div
            ref={editorRef}
            contentEditable={!!selectedCase}
            suppressContentEditableWarning
            className="p-6 min-h-[600px] focus:outline-none leading-relaxed"
            style={{ fontFamily: "'Times New Roman', serif", color: '#1a1a1a', fontSize: '13pt', lineHeight: '1.8' }}
            dangerouslySetInnerHTML={{
              __html: selectedCase
                ? editorHTML
                : '<div style="color:#9CA3AF;font-family:inherit;font-size:13px;line-height:1.5;">Pick a client and case on the left to start assembling your document. The preview will update as you type.</div>',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className="h-8 w-8 rounded flex items-center justify-center transition-colors"
      style={{ color: '#374151' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(13,27,42,0.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}

function ToolbarDiv() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />
}


function FieldLabel({
  label,
  isAuto,
  isOverridden,
  onReset,
}: {
  label: string
  isAuto?: boolean
  isOverridden?: boolean
  onReset?: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <Label className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: '#6B7280' }}>
        {label}
        {isAuto && (
          <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,151,43,0.12)', color: 'var(--gold)' }}>
            FROM CASE
          </span>
        )}
        {isOverridden && (
          <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(46,125,79,0.1)', color: '#2E7D4F' }}>
            EDITED
          </span>
        )}
      </Label>
      {isOverridden && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[10px] font-medium hover:opacity-70 transition-opacity"
          style={{ color: 'var(--gold)' }}
          title="Reset to case default"
        >
          <ArrowCounterClockwise size={9} />
          Reset
        </button>
      )}
    </div>
  )
}

function FieldWarning({ text }: { text: string }) {
  return (
    <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: '#C0392B' }}>
      <WarningCircle size={10} />
      {text}
    </p>
  )
}

function FieldRow({
  label,
  fieldKey,
  value,
  onChange,
  onReset,
  isAuto,
  isOverridden,
  placeholder,
  textarea,
  inputType,
  warning,
}: {
  label: string
  fieldKey: string
  value: string
  onChange: (v: string) => void
  onReset: () => void
  isAuto: boolean
  isOverridden: boolean
  placeholder?: string
  textarea?: boolean
  inputType?: string
  warning?: string
}) {
  return (
    <div className="mb-3">
      <FieldLabel label={label} isAuto={isAuto} isOverridden={isOverridden} onReset={onReset} />
      {textarea ? (
        <Textarea
          id={fieldKey}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input
          id={fieldKey}
          type={inputType ?? 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10"
        />
      )}
      {warning && <FieldWarning text={warning} />}
    </div>
  )
}
