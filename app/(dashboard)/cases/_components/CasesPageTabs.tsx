'use client'

import { FileText, Plus, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { CasesTab } from '../_types'
import { TabButton } from './TabButton'

/**
 * Top bar: Cases/Stages tabs on the left, action buttons on the right.
 */
export function CasesPageTabs({
  activeTab,
  onTabChange,
  onManageTags,
  onNewCase,
}: {
  activeTab: CasesTab
  onTabChange: (tab: CasesTab) => void
  onManageTags: () => void
  onNewCase: () => void
}) {
  return (
    <div
      className="flex items-end justify-between border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex gap-1">
        <TabButton
          active={activeTab === 'cases'}
          onClick={() => onTabChange('cases')}
        >
          Cases
        </TabButton>
        <TabButton
          active={activeTab === 'stages'}
          onClick={() => {
            onTabChange('stages')
            toast.info('Stages admin is coming next.')
          }}
        >
          Stages
        </TabButton>
      </div>
      <div className="flex items-center gap-2 pb-2">
        <Button variant="outline" size="sm" onClick={onManageTags}>
          <Tag size={13} strokeWidth={1.75} />
          Manage tags
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info('Case templates is coming next.')}
        >
          <FileText size={13} strokeWidth={1.75} />
          Case templates
        </Button>
        <Button onClick={onNewCase} size="sm" className="rounded-lg">
          <Plus size={13} strokeWidth={2} />
          New case
        </Button>
      </div>
    </div>
  )
}
