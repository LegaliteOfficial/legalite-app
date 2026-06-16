'use client'

/**
 * Case editor — orchestration hook.
 *
 * Owns: form state, prefill from URL, edit-mode seeding, scroll-spy nav,
 * mutations, save handler. The shell component receives this as a
 * single object so it can wire props without re-deriving any of it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useClients } from '@/hooks/use-clients'
import { useCreateCase, useUpdateCase } from '@/hooks/use-cases'
import { useFirmMembers } from '@/hooks/use-firm-members'
import {
  useCaseAssignments,
  useSetCaseAssignments,
} from '@/hooks/use-case-assignments'

import { INITIAL_FORM, SECTIONS } from '../_constants'
import { buildCaseDetails } from '../_lib/serialize'
import type { NewCaseForm, SetField } from '../_types'
import { useFirmUserOptions } from './use-firm-user-options'

export type EditorMode = 'create' | 'edit'

interface UseCaseEditorStateArgs {
  mode: EditorMode
  caseId?: string
  initialForm?: NewCaseForm
}

export function useCaseEditorState({
  mode,
  caseId,
  initialForm,
}: UseCaseEditorStateArgs) {
  const isEdit = mode === 'edit'
  const router = useRouter()

  // `?client=<id>` lets the Clients page link straight into the
  // new-case form with a client pre-selected. Optional — falls
  // through cleanly when absent.
  const searchParams = useSearchParams()
  const prefilledClientId = searchParams.get('client') ?? ''

  // Data sources.
  const createMutation = useCreateCase()
  const updateMutation = useUpdateCase()
  const setCaseAssignments = useSetCaseAssignments()
  const { data: clients } = useClients()
  const { data: firmMembers } = useFirmMembers()
  const firmUserOptions = useFirmUserOptions()

  // Active firm members available to assign, as {id, name} options.
  const memberOptions = useMemo(
    () =>
      (firmMembers ?? [])
        .filter((m) => m.status === 'active')
        .map((m) => ({ id: m.id, name: m.name || m.email })),
    [firmMembers],
  )

  // In edit mode, seed the team picker from the case's existing assignments
  // once they load so saving doesn't wipe the team.
  const { data: existingAssignments } = useCaseAssignments(
    isEdit ? caseId : undefined,
  )
  const seededAssignees = useRef(false)

  const [form, setForm] = useState<NewCaseForm>(() => {
    if (initialForm) return initialForm
    return prefilledClientId
      ? { ...INITIAL_FORM, client_ids: [prefilledClientId] }
      : INITIAL_FORM
  })
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id)
  const [submitting, setSubmitting] = useState(false)
  // Tag manager dialog — opens from the Tags field's "Manage tags" link.
  // Stays at the page level so a single mount is shared across the
  // places that need it.
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false)

  const setField: SetField = useCallback((key, val) => {
    setForm((f) => ({ ...f, [key]: val }))
  }, [])

  // Cancel returns to the case detail when editing, the list when creating.
  const cancelTarget = isEdit && caseId ? `/cases/${caseId}` : '/cases'

  // Seed the team picker from existing assignments once, in edit mode.
  useEffect(() => {
    if (!isEdit || seededAssignees.current || !existingAssignments) return
    seededAssignees.current = true
    const ids = existingAssignments.map((a) => a.member_id)
    if (ids.length > 0) setForm((f) => ({ ...f, assigned_member_ids: ids }))
  }, [isEdit, existingAssignments])

  // Track which section is in view as the user scrolls so the left nav
  // highlights the right anchor.
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      {
        // Trigger when a section's top is between 25% and 60% down the
        // viewport — gives a stable "current" feel even on long sections.
        rootMargin: '-25% 0px -40% 0px',
        threshold: 0,
      },
    )
    Object.values(sectionRefs.current).forEach(
      (el) => el && observer.observe(el),
    )
    return () => observer.disconnect()
  }, [])

  const registerSectionRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      sectionRefs.current[id] = el
    },
    [],
  )

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }, [])

  const canSave = useMemo(() => {
    const hasClient = form.client_ids.some((id) => !!id)
    return hasClient && form.description.trim().length > 0
  }, [form.client_ids, form.description])

  const handleSave = useCallback(
    async (alsoRunConflictCheck: boolean) => {
      if (!canSave) {
        toast.error('Add a client and a case description before saving.')
        return
      }
      setSubmitting(true)
      try {
        // Title is the first non-empty line of the description; the
        // description itself goes into `notes` so nothing is lost.
        const title =
          form.description
            .split('\n')
            .find((l) => l.trim().length > 0)
            ?.trim() || 'Untitled case'
        const primaryClient = form.client_ids.find((id) => !!id) ?? ''

        const payload = {
          title,
          client_id: primaryClient,
          court: form.court || undefined,
          suit_number: form.suit_number || undefined,
          opposing_party: form.opposing_party || undefined,
          next_court_date: form.next_court_date || undefined,
          case_type: form.practice_area || undefined,
          case_stage: form.case_stage || undefined,
          assigned_lawyer: form.responsible_lawyer || undefined,
          originating_lawyer: form.originating_lawyer || undefined,
          status: form.status,
          date_opened: form.open_date || undefined,
          notes: form.description,
          // Everything else the form collects (reminders, statute, tags,
          // billing, permissions, task lists, ...) is captured here.
          details: buildCaseDetails(form),
        }

        // Real member assignments (notified by email on create).
        // assignment_role defaults to collaborator; responsible/originating
        // are free-text above.
        const assignments = form.assigned_member_ids.map((id) => ({
          member_id: id,
          assignment_role: 'collaborator',
        }))

        if (isEdit && caseId) {
          // UpdateCaseInput has no assignments field — persist the team
          // separately so the update payload stays whitelisted.
          await updateMutation.mutateAsync({ id: caseId, data: payload })
          await setCaseAssignments.mutateAsync(caseId, assignments)
          toast.success('Case updated successfully.')
          router.push(`/cases/${caseId}`)
          return
        }

        await createMutation.mutateAsync(
          assignments.length > 0 ? { ...payload, assignments } : payload,
        )
        toast.success('Case created successfully.')
        if (alsoRunConflictCheck) {
          toast.info(
            'Conflict check will run as soon as the conflict-check screen ships.',
          )
        }
        router.push('/cases')
      } catch (err) {
        toast.error(
          err instanceof Error
            ? `Unable to ${isEdit ? 'update' : 'create'} case: ${err.message}`
            : `Unable to ${isEdit ? 'update' : 'create'} case. Please try again.`,
        )
      } finally {
        setSubmitting(false)
      }
    },
    [
      canSave,
      form,
      isEdit,
      caseId,
      createMutation,
      updateMutation,
      setCaseAssignments,
      router,
    ],
  )

  const handleCancel = useCallback(() => {
    router.push(cancelTarget)
  }, [router, cancelTarget])

  return {
    isEdit,
    form,
    setField,
    activeSection,
    registerSectionRef,
    scrollToSection,
    canSave,
    submitting,
    handleSave,
    handleCancel,
    tagsDialogOpen,
    setTagsDialogOpen,
    // Picker datasets surfaced to sections that need them.
    firmUserOptions,
    memberOptions,
    clientOptions: useMemo(
      () =>
        (clients ?? []).map((c) => ({
          id: c.id,
          label: c.full_name,
        })),
      [clients],
    ),
    contactOptions: useMemo(
      () =>
        (clients ?? []).map((c) => ({
          id: c.id,
          label: c.full_name,
          email: c.email ?? undefined,
        })),
      [clients],
    ),
  }
}

export type CaseEditorState = ReturnType<typeof useCaseEditorState>
