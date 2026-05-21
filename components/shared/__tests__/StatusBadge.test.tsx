import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

afterEach(cleanup)

describe('StatusBadge', () => {
  it('renders the status text', () => {
    const { getByText } = render(<StatusBadge status="Active" />)
    expect(getByText('Active')).toBeInTheDocument()
  })

  it('applies green styling for Active status', () => {
    const { container } = render(<StatusBadge status="Active" />)
    const badge = container.querySelector('span')!
    expect(badge.style.color).toContain('46, 125, 79')
  })

  it('applies red styling for Overdue status', () => {
    const { container } = render(<StatusBadge status="Overdue" />)
    const badge = container.querySelector('span')!
    expect(badge.style.color).toContain('192, 57, 43')
  })

  it('applies yellow styling for Pending status', () => {
    const { container } = render(<StatusBadge status="Pending" />)
    const badge = container.querySelector('span')!
    expect(badge.style.color).toContain('184, 134, 11')
  })

  it('applies blue styling for In Progress status', () => {
    const { container } = render(<StatusBadge status="In Progress" />)
    const badge = container.querySelector('span')!
    expect(badge.style.color).toContain('37, 99, 235')
  })

  it('handles unknown status with gray fallback', () => {
    const { container } = render(<StatusBadge status="SomethingElse" />)
    const badge = container.querySelector('span')!
    expect(badge.style.color).toContain('107, 114, 128')
  })

  it('applies additional className when provided', () => {
    const { container } = render(<StatusBadge status="Active" className="extra-class" />)
    const badge = container.querySelector('span')!
    expect(badge.className).toContain('extra-class')
  })

  it('renders as a span element', () => {
    const { container } = render(<StatusBadge status="Active" />)
    const badge = container.querySelector('span')!
    expect(badge.tagName).toBe('SPAN')
  })
})
