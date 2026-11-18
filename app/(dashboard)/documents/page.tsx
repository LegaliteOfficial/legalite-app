'use client'

/**
 * Documents home. Starting a document (AI, blank or template) is the first
 * thing on the page; below it, the firm's documents with their workflow
 * status. Each document opens in the studio on its own route,
 * /documents/[id], so drafting never shares a page with the list.
 */

import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { TemplateAssembly } from '@/components/shared/TemplateAssembly'
import { DocumentAssistant } from '@/components/ai/DocumentAssistant'

import { CaseContextBanner } from './_components/CaseContextBanner'
import { DocumentsErrorPanel } from './_components/DocumentsErrorPanel'
import { DocumentsTabs } from './_components/DocumentsTabs'
import { LibraryTab } from './_components/LibraryTab'
import { MyTemplates } from './_components/MyTemplates'
import { TemplatesTab } from './_components/TemplatesTab'
import { DocumentsList } from './_components/home/DocumentsList'
import { DraftComposer } from './_components/home/DraftComposer'
import { useDocumentsPageState } from './_hooks/use-documents-page-state'

const TAB_LABELS: Record<string, string> = {
  documents: 'Documents',
  templates: 'Templates',
  library: 'Legal library',
}

export default function DocumentsPage() {
  const state = useDocumentsPageState()
  const { start } = state

  if (state.isLoading) return <PageSkeleton />

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6">
        <PageHeader title="Documents" description="Draft, review and file your legal documents, with AI beside you." />

        {state.caseContext && (
          <div className="mt-5">
            <CaseContextBanner caseTitle={state.caseContext.title} onClear={state.clearCaseContext} />
          </div>
        )}

        <div className="mt-5">
          <DraftComposer
            cases={state.documentCases}
            defaultCaseId={state.caseContext?.id ?? null}
            starting={start.starting}
            onDraft={(instruction, linked) => void start.startWithAi(instruction, linked)}
            onBlank={(linked) => void start.startBlank(linked)}
            onBrowseTemplates={() => state.setActiveTab('templates')}
          />
        </div>

        <DocumentsTabs
          active={state.activeTab}
          onChange={state.setActiveTab}
          documentCount={state.workDocuments.length}
        />

        <div className="pt-6 pb-24">
          {state.activeTab === 'documents' &&
            (state.error ? (
              <DocumentsErrorPanel what="documents" onRetry={() => void state.refetch()} />
            ) : (
              <DocumentsList
                documents={state.workDocuments}
                cases={state.documentCases}
                onSetStatus={(doc, s) => void state.setStatus(doc, s)}
                onDelete={(doc) => void state.deleteDocument(doc.id, doc.title)}
                onStartBlank={() => void start.startBlank()}
              />
            ))}

          {state.activeTab === 'templates' && !state.quickSetupTemplate && (
            <>
              <MyTemplates
                templates={state.myTemplates}
                onOpen={(doc) => void start.startFromFirmTemplate(doc)}
                onBlank={() => void start.startBlank()}
                onDelete={(id, title) => void state.deleteDocument(id, title)}
              />
              <TemplatesTab
                search={state.templateSearch}
                onSearchChange={state.setTemplateSearch}
                selectedCategory={state.selectedCategory}
                onSelectCategory={state.setSelectedCategory}
                filteredTemplates={state.filteredTemplates}
                onSelectTemplate={(id) => void start.startFromTemplate(id)}
                onQuickSetup={state.openQuickSetup}
              />
            </>
          )}

          {state.activeTab === 'templates' && state.quickSetupTemplate && (
            <TemplateAssembly
              template={state.quickSetupTemplate}
              onBack={state.closeQuickSetup}
              onSaved={() => {
                state.closeQuickSetup()
                state.setActiveTab('documents')
              }}
              initialCaseId={state.caseContext?.id}
            />
          )}

          {state.activeTab === 'library' && (
            <LibraryTab
              search={state.librarySearch}
              onSearchChange={state.setLibrarySearch}
              category={state.libraryCategory}
              onCategoryChange={state.setLibraryCategory}
              filteredLibrary={state.filteredLibrary}
              isLoading={state.libraryLoading}
              isUploading={state.isUploadingLibrary}
              isDownloading={state.isDownloadingLibrary}
              onUpload={state.handleLibraryUpload}
              onDownload={state.handleLibraryDownload}
              onDelete={state.handleLibraryDelete}
              onFavorite={state.handleLibraryFavorite}
            />
          )}
        </div>

        <DeleteDialog />
      </div>

      <DocumentAssistant
        context={{
          tab: TAB_LABELS[state.activeTab] ?? state.activeTab,
          visibleDocuments:
            state.activeTab === 'documents'
              ? state.workDocuments.map((d) => d.title)
              : state.activeTab === 'library'
                ? state.filteredLibrary.map((d) => d.title)
                : state.filteredTemplates.map((t) => t.name),
        }}
      />
    </div>
  )
}
