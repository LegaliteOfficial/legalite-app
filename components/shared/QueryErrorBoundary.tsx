'use client'

/**
 * Error boundary for a suspense-driven section. `useSuspenseQuery`
 * throws query errors to the nearest boundary; wrapping each section
 * keeps one failed query from taking down the whole page, and gives
 * the user a retry in place.
 */

import { Component, type ReactNode } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface QueryErrorBoundaryProps {
  children: ReactNode
  /** Short description of what failed to load, e.g. "your docket". */
  label: string
  /** Called before the boundary resets — start a fresh request here. */
  onRetry?: () => void
  className?: string
}

interface QueryErrorBoundaryState {
  error: Error | null
}

export class QueryErrorBoundary extends Component<QueryErrorBoundaryProps, QueryErrorBoundaryState> {
  state: QueryErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
    return { error }
  }

  private handleRetry = () => {
    this.props.onRetry?.()
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        role="alert"
        className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${this.props.className ?? ''}`}
        style={{ background: 'var(--surface-card)', borderColor: 'rgba(192,57,43,0.25)' }}
      >
        <WarningCircle size={18} weight="duotone" style={{ color: '#C0392B' }} className="shrink-0" />
        <p className="flex-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          We could not load {this.props.label}.
        </p>
        <Button size="sm" variant="outline" className="h-7 rounded-full text-[12px]" onClick={this.handleRetry}>
          Try again
        </Button>
      </div>
    )
  }
}
