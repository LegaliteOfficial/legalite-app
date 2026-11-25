import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

afterEach(cleanup)

// The badge is a neutral chip; the status is carried by the colour of its dot.
const dotColor = (container: HTMLElement) =>
  (container.querySelector('span > span[aria-hidden]') as HTMLElement).style.background

describe('StatusBadge', () => {
  it('renders the status text', () => {
    const { getByText } = render(<StatusBadge status="Active" />)
    expect(getByText('Active')).toBeInTheDocument()
  })

  it('shows a green dot for Active status', () => {
    const { container } = render(<StatusBadge status="Active" />)
    expect(dotColor(container)).toContain('46, 125, 79')
  })

  it('shows a red dot for Overdue status', () => {
    const { container } = render(<StatusBadge status="Overdue" />)
    expect(dotColor(container)).toContain('192, 57, 43')
  })

  it('shows a gold dot for Pending status', () => {
    const { container } = render(<StatusBadge status="Pending" />)
    expect(dotColor(container)).toContain('201, 151, 43')
  })

  it('shows a blue dot for In Progress status', () => {
    const { container } = render(<StatusBadge status="In Progress" />)
    expect(dotColor(container)).toContain('37, 99, 235')
  })

  it('falls back to a grey dot for an unknown status', () => {
    const { container } = render(<StatusBadge status="SomethingElse" />)
    expect(dotColor(container)).toContain('138, 143, 153')
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
