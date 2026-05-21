'use client'

import { useEffect, useRef, useState } from 'react'

const CHARS = '!<>-_\\/[]{}—=+*^?#________'

interface Props {
  text: string
  speed?: number
  trigger?: 'hover' | 'mount'
  className?: string
}

export function TextScramble({ text, speed = 20, trigger = 'hover', className }: Props) {
  const [output, setOutput] = useState(text)
  const frameRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const queue = useRef<{ from: string; to: string; start: number; end: number; char?: string }[]>([])

  function update() {
    let out = ''
    let complete = 0
    for (let i = 0, n = queue.current.length; i < n; i++) {
      const item = queue.current[i]
      let { from, to, start, end, char } = item
      if (frameRef.current >= end) {
        complete++
        out += to
      } else if (frameRef.current >= start) {
        if (!char || Math.random() < 0.28) {
          char = CHARS[Math.floor(Math.random() * CHARS.length)]
          item.char = char
        }
        out += `<span style="opacity:0.5">${char}</span>`
      } else {
        out += from
      }
    }
    setOutput(out)
    if (complete < queue.current.length) {
      rafRef.current = requestAnimationFrame(update)
      frameRef.current++
    }
  }

  function scramble() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const length = text.length
    queue.current = []
    for (let i = 0; i < length; i++) {
      const from = text[i]
      const to = text[i]
      const start = Math.floor(Math.random() * 40)
      const end = start + Math.floor(Math.random() * 40)
      queue.current.push({ from, to, start, end })
    }
    frameRef.current = 0
    update()
  }

  useEffect(() => {
    if (trigger === 'mount') scramble()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlers =
    trigger === 'hover'
      ? {
          onMouseEnter: scramble,
        }
      : {}

  return (
    <span
      className={className}
      {...handlers}
      dangerouslySetInnerHTML={{ __html: output }}
    />
  )
}
