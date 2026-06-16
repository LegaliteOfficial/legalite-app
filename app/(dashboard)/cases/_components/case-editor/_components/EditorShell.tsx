'use client'

/**
 * Editor composition root. Consumes `useCaseEditorState` and wires the
 * resulting props to the section components. No business logic lives
 * here — every section gets `form` + `setField` (and any picker
 * datasets it specifically needs).
 */

import { TagSettingsDialog } from '@/components/shared/TagSettingsDialog'
import { useCaseEditorState, type EditorMode } from '../_hooks/use-case-editor-state'
import type { NewCaseForm } from '../_types'
import { EditorFooterActions, EditorTopBar } from './EditorTopBar'
import { PendingSectionStub } from './PendingSectionStub'
import { Section } from './Section'
import { SectionNav } from './SectionNav'
import { FieldLabel } from './primitives/FieldLabel'
import { FirmUserMultiPicker } from './pickers/FirmUserMultiPicker'
import { BillingSection } from './sections/BillingSection'
import { CaseDetailsSection } from './sections/CaseDetailsSection'
import { ClientsSection } from './sections/ClientsSection'
import { ConflictChecksSection } from './sections/ConflictChecksSection'
import { DocumentFoldersSection } from './sections/DocumentFoldersSection'
import { PermissionsSection } from './sections/PermissionsSection'
import { RelatedContactsSection } from './sections/RelatedContactsSection'
import { ReportsSection } from './sections/ReportsSection'
import { TaskListsSection } from './sections/TaskListsSection'

export interface EditorShellProps {
  mode?: EditorMode
  caseId?: string
  initialForm?: NewCaseForm
}

export function EditorShell({
  mode = 'create',
  caseId,
  initialForm,
}: EditorShellProps) {
  const state = useCaseEditorState({ mode, caseId, initialForm })
  const {
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
    firmUserOptions,
    memberOptions,
    clientOptions,
    contactOptions,
  } = state

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <EditorTopBar
        isEdit={isEdit}
        submitting={submitting}
        canSave={canSave}
        onCancel={handleCancel}
        onSave={handleSave}
      />

      {/* Body: sticky left nav + scrolling form on the right */}
      <div className="flex-1 flex overflow-hidden">
        <SectionNav active={activeSection} onSelect={scrollToSection} />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[820px] px-8 py-8 space-y-6">
            <Section
              id="template"
              label="Template information"
              registerRef={registerSectionRef('template')}
              description="Apply a saved template to prefill repetitive fields. Templates land with the Case templates screen."
            >
              <PendingSectionStub message="Template chooser coming next." />
            </Section>

            <Section
              id="clients"
              label="Clients"
              registerRef={registerSectionRef('clients')}
            >
              <ClientsSection
                clientIds={form.client_ids}
                onChange={(ids) => setField('client_ids', ids)}
                clientOptions={clientOptions}
              />
            </Section>

            <Section
              id="case-details"
              label="Case details"
              registerRef={registerSectionRef('case-details')}
            >
              <CaseDetailsSection
                form={form}
                setField={setField}
                firmUserOptions={firmUserOptions}
                memberOptions={memberOptions}
                onOpenTagSettings={() => setTagsDialogOpen(true)}
              />
            </Section>

            <Section
              id="permissions"
              label="Case permissions"
              registerRef={registerSectionRef('permissions')}
            >
              <PermissionsSection
                form={form}
                setField={setField}
                firmUserOptions={firmUserOptions}
              />
            </Section>

            <Section
              id="notifications"
              label="Case notifications"
              registerRef={registerSectionRef('notifications')}
              description="Firm users that you select will receive notifications when the status of this case changes or the case is deleted. They will also be notified when documents are uploaded by clients and related contacts."
            >
              <FieldLabel>Firm user</FieldLabel>
              <FirmUserMultiPicker
                value={form.notification_subscribers}
                onChange={(v) => setField('notification_subscribers', v)}
                firmUsers={firmUserOptions}
                placeholder="Find a firm user"
              />
            </Section>

            <Section
              id="block-users"
              label="Block users"
              registerRef={registerSectionRef('block-users')}
              description="Listed users won't see this case anywhere in LegaLite, even if they otherwise have firm-wide access."
            >
              <FieldLabel>Choose users to block</FieldLabel>
              <FirmUserMultiPicker
                value={form.blocked_users}
                onChange={(v) => setField('blocked_users', v)}
                firmUsers={firmUserOptions}
                placeholder="Find a firm user"
              />
            </Section>

            <Section
              id="related-contacts"
              label="Related contacts"
              registerRef={registerSectionRef('related-contacts')}
              description="Witnesses, opposing parties, experts — anyone tied to the case besides the client."
            >
              <RelatedContactsSection
                value={form.related_contacts}
                onChange={(v) => setField('related_contacts', v)}
                contactOptions={contactOptions}
              />
            </Section>

            <Section
              id="custom-fields"
              label="Custom fields"
              registerRef={registerSectionRef('custom-fields')}
              description="Firm-defined attributes attached to every case. Manage them from settings."
            >
              <PendingSectionStub message="Custom fields admin is coming next." />
            </Section>

            <Section
              id="billing"
              label="Billing preference"
              registerRef={registerSectionRef('billing')}
            >
              <BillingSection
                form={form}
                setField={setField}
                firmUserOptions={firmUserOptions}
              />
            </Section>

            <Section
              id="tasks"
              label="Task lists"
              registerRef={registerSectionRef('tasks')}
              description="Pre-populate the case with a task list (intake, discovery, trial prep, etc.)."
            >
              <TaskListsSection form={form} setField={setField} />
            </Section>

            <Section
              id="documents"
              label="Document folders"
              registerRef={registerSectionRef('documents')}
              description="Folder structure created automatically when the case opens."
            >
              <DocumentFoldersSection form={form} setField={setField} />
            </Section>

            <Section
              id="reports"
              label="Reports"
              registerRef={registerSectionRef('reports')}
              description="Allocation percentages used in originating and responsible attorney reports."
            >
              <ReportsSection form={form} setField={setField} />
            </Section>

            <Section
              id="conflicts"
              label="Conflict checks"
              registerRef={registerSectionRef('conflicts')}
              description="Run a conflict search across past cases and contacts before opening."
            >
              <ConflictChecksSection form={form} setField={setField} />
            </Section>

            <EditorFooterActions
              isEdit={isEdit}
              submitting={submitting}
              canSave={canSave}
              onCancel={handleCancel}
              onSave={handleSave}
            />
          </div>
        </div>
      </div>

      <TagSettingsDialog
        open={tagsDialogOpen}
        onOpenChange={setTagsDialogOpen}
      />
    </div>
  )
}
