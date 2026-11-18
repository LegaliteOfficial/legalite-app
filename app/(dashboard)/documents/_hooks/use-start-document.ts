'use client'

/**
 * Starting a document. Every route into the studio (blank, a built-in
 * template, a firm template, or "Draft with AI") creates the document on
 * the server first and then opens /documents/<id>. So a new document has
 * a real URL from the first keystroke, autosaves, survives a refresh and
 * appears in the list straight away; nothing is lost by navigating off.
 *
 * "Draft with AI" hands its instruction to the studio through
 * sessionStorage (see takeDraftIntent), not the URL: the instruction can
 * be long and may describe a client's matter, which should not end up in
 * browser history or server logs.
 */

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCreateDocument } from '@/hooks/use-documents'
import { DOCUMENT_TEMPLATES, generateDocumentHTML } from '@/lib/templates'
import type { Case, Document } from '@/types'

const INTENT_PREFIX = 'll-draft-intent:'

export interface DraftIntent {
  instruction: string
}

/** Reads and clears the AI instruction left for a newly created document. */
export function takeDraftIntent(docId: string): DraftIntent | null {
  try {
    const key = INTENT_PREFIX + docId
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    sessionStorage.removeItem(key)
    const parsed = JSON.parse(raw) as DraftIntent
    return parsed?.instruction ? parsed : null
  } catch {
    return null
  }
}

function leaveDraftIntent(docId: string, intent: DraftIntent) {
  try {
    sessionStorage.setItem(INTENT_PREFIX + docId, JSON.stringify(intent))
  } catch {
    // Storage blocked (private mode): the studio opens without auto-drafting
    // and the user can run the instruction from the AI panel instead.
  }
}

/** A short working title from a free-text instruction. */
export function titleFromInstruction(instruction: string): string {
  const firstLine = instruction.trim().split('\n')[0].replace(/^(please\s+)?(draft|write|prepare|create)\s+(me\s+)?(an?\s+|the\s+)?/i, '')
  const t = firstLine.charAt(0).toUpperCase() + firstLine.slice(1)
  return t.length > 70 ? `${t.slice(0, 67).trimEnd()}...` : t || 'Untitled document'
}

type Starting = 'blank' | 'template' | 'ai' | null

export function useStartDocument(caseContext?: Case) {
  const router = useRouter()
  const create = useCreateDocument()
  const [starting, setStarting] = useState<Starting>(null)

  const open = useCallback(
    async (
      kind: Exclude<Starting, null>,
      input: {
        title: string
        html: string
        templateType: string
        design?: Record<string, unknown> | null
        caseOverride?: Case | null
        intent?: DraftIntent
      },
    ) => {
      const linked = input.caseOverride === undefined ? caseContext : input.caseOverride ?? undefined
      setStarting(kind)
      try {
        const created = await create.mutateAsync({
          title: input.title || 'Untitled document',
          content: input.html,
          template_type: input.templateType,
          design: input.design ?? undefined,
          case_id: linked?.id ?? '',
          court: linked?.court ?? '',
          suit_number: linked?.suit_number ?? '',
          // status is left to the column default ('draft').
        })
        if (!created?.id) throw new Error('The document was not created.')
        if (input.intent) leaveDraftIntent(created.id, input.intent)
        router.push(`/documents/${created.id}`)
      } catch (err) {
        toast.error(err instanceof Error && err.message ? err.message : 'Unable to create the document.')
        setStarting(null)
      }
    },
    [caseContext, create, router],
  )

  const startBlank = useCallback(
    (caseOverride?: Case | null) =>
      open('blank', { title: 'Untitled document', html: '', templateType: 'Custom', caseOverride }),
    [open],
  )

  const startFromTemplate = useCallback(
    (templateId: string) => {
      const tmpl = DOCUMENT_TEMPLATES.find((t) => t.id === templateId)
      if (!tmpl) return
      const fields: Record<string, string> = {}
      for (const f of tmpl.fields) fields[f.key] = f.placeholder ?? `[${f.label}]`
      const court = caseContext?.court || 'High Court (General Division)'
      const html = generateDocumentHTML(templateId, court, caseContext?.suit_number ?? '', tmpl.name, fields)
      return open('template', { title: tmpl.name, html, templateType: tmpl.name })
    },
    [open, caseContext],
  )

  const startFromFirmTemplate = useCallback(
    (doc: Document) =>
      open('template', {
        title: doc.title,
        html: doc.content ?? '',
        design: doc.design,
        templateType: 'Firm template',
      }),
    [open],
  )

  const startWithAi = useCallback(
    (instruction: string, caseOverride?: Case | null) =>
      open('ai', {
        title: titleFromInstruction(instruction),
        html: '',
        templateType: 'AI draft',
        caseOverride,
        intent: { instruction: instruction.trim() },
      }),
    [open],
  )

  return { starting, startBlank, startFromTemplate, startFromFirmTemplate, startWithAi }
}
