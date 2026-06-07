'use client'

/**
 * Documents page — composition root only.
 *
 * State + handlers live in _hooks/use-documents-page-state; each tab's
 * UI lives in _components; static types/constants in _types and
 * _constants. The page itself just wires tabs to sub-views.
 */

import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { TemplateAssembly } from '@/components/shared/TemplateAssembly'

import { DocumentsErrorPanel } from './_components/DocumentsErrorPanel'
import { DocumentsTabs } from './_components/DocumentsTabs'
import { DraftsTab } from './_components/DraftsTab'
import { EditorTab } from './_components/EditorTab'
import { LibraryTab } from './_components/LibraryTab'
import { TemplatesTab } from './_components/TemplatesTab'
import { useDocumentsPageState } from './_hooks/use-documents-page-state'

export default function DocumentsPage() {
  const state = useDocumentsPageState()

  if (state.isLoading) return <PageSkeleton />
  if (state.error) return <DocumentsErrorPanel />

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Documents"
          description="Templates, drafts, and your legal library."
        />

        <DocumentsTabs
          active={state.activeTab}
          onChange={state.setActiveTab}
          documentCount={state.documents?.length ?? 0}
        />

        {state.activeTab === 'templates' && !state.showQuickSetup && (
          <TemplatesTab
            search={state.templateSearch}
            onSearchChange={state.setTemplateSearch}
            selectedCategory={state.selectedCategory}
            onSelectCategory={state.setSelectedCategory}
            filteredTemplates={state.filteredTemplates}
            onSelectTemplate={state.handleSelectTemplate}
            onQuickSetup={state.handleOpenQuickSetup}
          />
        )}

        {state.activeTab === 'templates' &&
          state.showQuickSetup &&
          state.template && (
            <TemplateAssembly
              template={state.template}
              onBack={() => {
                state.setShowQuickSetup(false)
                state.setSelectedTemplate('')
              }}
              onSaved={() => state.setActiveTab('drafts')}
            />
          )}

        {state.activeTab === 'drafts' && (
          <DraftsTab
            documents={state.documents}
            documentCases={state.documentCases}
            search={state.draftSearch}
            onSearchChange={state.setDraftSearch}
            onOpen={state.openDraftInEditor}
            onDelete={state.deleteDraft}
            onBrowseTemplates={() => state.setActiveTab('templates')}
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

        {state.activeTab === 'editor' && (
          <EditorTab
            draftTitle={state.draftTitle}
            onTitleChange={state.setDraftTitle}
            court={state.court}
            suitNumber={state.suitNumber}
            editingDocId={state.editingDocId}
            isSaving={state.isEditorSaving}
            onExport={state.handleExport}
            onPrint={state.handlePrint}
            onSave={state.handleSave}
            exec={state.execCommand}
            editorRef={state.editorRef}
            initialHTML={state.editorHTML}
            onEditorInput={state.setEditorHTML}
          />
        )}

        <DeleteDialog />
      </div>
    </div>
  )
}
