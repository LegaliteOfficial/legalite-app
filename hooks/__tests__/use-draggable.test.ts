import { describe, it, expect } from 'vitest'
import { clampToViewport, defaultPosition } from '../use-draggable'

const SIZE = { width: 260, height: 56 }
const VIEW = { width: 1280, height: 800 }

describe('clampToViewport', () => {
  it('leaves a position that is already inside alone', () => {
    expect(clampToViewport({ x: 400, y: 300 }, SIZE, VIEW)).toEqual({ x: 400, y: 300 })
  })

  it('pulls a box back from the right and bottom edges', () => {
    // Fully off the bottom right corner.
    expect(clampToViewport({ x: 5000, y: 5000 }, SIZE, VIEW)).toEqual({
      x: 1280 - 260 - 8,
      y: 800 - 56 - 8,
    })
  })

  it('pulls a box back from the left and top edges', () => {
    expect(clampToViewport({ x: -500, y: -500 }, SIZE, VIEW)).toEqual({ x: 8, y: 8 })
  })

  it('keeps a box reachable when it is wider than the viewport', () => {
    // A 400px widget on a 320px phone must pin left, not drift right where
    // its stop button would be unreachable.
    const narrow = { width: 320, height: 640 }
    const wide = { width: 400, height: 56 }
    expect(clampToViewport({ x: 300, y: 10 }, wide, narrow)).toEqual({ x: 8, y: 10 })
  })

  it('honours a custom margin', () => {
    expect(clampToViewport({ x: 0, y: 0 }, SIZE, VIEW, 20)).toEqual({ x: 20, y: 20 })
  })

  it('is idempotent — clamping twice changes nothing', () => {
    const once = clampToViewport({ x: 9999, y: -9999 }, SIZE, VIEW)
    expect(clampToViewport(once, SIZE, VIEW)).toEqual(once)
  })
})

describe('defaultPosition', () => {
  it('rests in the bottom right, matching the old fixed position', () => {
    expect(defaultPosition(SIZE, VIEW)).toEqual({
      x: 1280 - 260 - 20,
      y: 800 - 56 - 20,
    })
  })

  it('stays on screen on a small phone', () => {
    const phone = { width: 390, height: 844 }
    const p = defaultPosition(SIZE, phone)
    expect(p.x).toBeGreaterThanOrEqual(0)
    expect(p.y).toBeGreaterThanOrEqual(0)
    expect(p.x + SIZE.width).toBeLessThanOrEqual(phone.width)
    expect(p.y + SIZE.height).toBeLessThanOrEqual(phone.height)
  })
})
