/**
 * Deadline engine
 * ---------------
 * One place for everything that needs the user's attention before a
 * point in time: manual deadlines, tasks, calendar events, hearings,
 * case court dates and unpaid invoices, plus past events still waiting
 * on an outcome.
 *
 * This page is only the shell. Every section that reads data fetches it
 * itself and sits in its own error boundary and <Suspense> boundary, so
 * loading, refetching or failing in one section never re-renders or
 * blanks the rest. View state (scope, filters, dialogs) lives in
 * `useDeadlineEngineStore`, which each section subscribes to by slice.
 */

import { Suspense } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DocketBrief } from './_components/DocketBrief'
import { AttentionList } from './_components/AttentionList'
import { NotificationsCard, OutcomePanel, SourceBreakdown } from './_components/SidePanels'
import {
  AddDeadlineButton,
  DeadlineDialogs,
  FeedErrorBoundary,
  FeedLifecycle,
  HeaderSummary,
  ScopeToggle,
} from './_components/PageControls'
import {
  AttentionListSkeleton,
  DocketBriefSkeleton,
  HeaderSummarySkeleton,
  PanelSkeleton,
} from './_components/skeletons'

export default function DeadlinePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Deadline engine"
          actions={
            <>
              <ScopeToggle />
              <AddDeadlineButton />
            </>
          }
        >
          <FeedErrorBoundary label="your summary">
            <Suspense fallback={<HeaderSummarySkeleton />}>
              <HeaderSummary />
            </Suspense>
          </FeedErrorBoundary>
        </PageHeader>

        <div className="mt-6">
          <FeedErrorBoundary label="your docket">
            <Suspense fallback={<DocketBriefSkeleton />}>
              <DocketBrief />
            </Suspense>
          </FeedErrorBoundary>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <FeedErrorBoundary label="the attention list">
              <Suspense fallback={<AttentionListSkeleton />}>
                <AttentionList />
              </Suspense>
            </FeedErrorBoundary>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <FeedErrorBoundary label="outcomes to record">
              <Suspense fallback={<PanelSkeleton rows={2} />}>
                <OutcomePanel />
              </Suspense>
            </FeedErrorBoundary>
            <FeedErrorBoundary label="the category breakdown">
              <Suspense fallback={<PanelSkeleton rows={6} />}>
                <SourceBreakdown />
              </Suspense>
            </FeedErrorBoundary>
            <Suspense fallback={null}>
              <NotificationsCard />
            </Suspense>
          </aside>
        </div>

        <DeadlineDialogs />
        <FeedLifecycle />
      </div>
    </div>
  )
}
