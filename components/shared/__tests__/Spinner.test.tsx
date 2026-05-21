import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Spinner } from '../Spinner'

describe('Spinner', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Spinner />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('has animate-spin class', () => {
    const { container } = render(<Spinner />)
    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('animate-spin')).toBe(true)
  })

  it('uses default size of 16', () => {
    const { container } = render(<Spinner />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('16')
    expect(svg?.getAttribute('height')).toBe('16')
  })

  it('accepts custom size prop', () => {
    const { container } = render(<Spinner size={32} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('32')
    expect(svg?.getAttribute('height')).toBe('32')
  })

  it('accepts custom className', () => {
    const { container } = render(<Spinner className="text-gold" />)
    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('text-gold')).toBe(true)
  })

  it('contains circle and path elements', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('circle')).toBeInTheDocument()
    expect(container.querySelector('path')).toBeInTheDocument()
  })
})
