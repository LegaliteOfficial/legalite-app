'use client'

/**
 * Floating AI bar over selected text: one-click rewrites (Improve,
 * Formalise, Shorten, ...) and a box for a custom instruction. Results
 * open in the AI panel to accept or discard; nothing changes the page
 * until the lawyer says so.
 *
 * Positioned from the selection's screen coordinates, so it follows the
 * text through the canvas's scroll and zoom.
 */

import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { CaretRight, Sparkle } from '@phosphor-icons/react'
import { REWRITE_ACTIONS, type RewriteAction } from '@/lib/ai/drafting'

const MENU_ACTIONS = REWRITE_ACTIONS.filter((a) => a.id !== 'plain_english')

export function SelectionMenu({
  editor,
  disabled,
  onRewrite,
}: {
  editor: Editor
  disabled: boolean
  onRewrite: (how: { action?: RewriteAction; instruction?: string }) => void
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [custom, setCustom] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => {
      const { from, to, empty } = editor.state.selection
      const text = empty ? '' : editor.state.doc.textBetween(from, to, ' ').trim()
      if (!editor.isEditable || text.length < 3) {
        setPos(null)
        setCustom(null)
        return
      }
      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)
      const top = Math.min(start.top, end.top)
      setPos({ top: Math.max(8, top - 46), left: Math.max(8, (start.left + end.left) / 2) })
    }
    const onBlur = ({ event }: { event: FocusEvent }) => {
      // Clicks inside the menu blur the editor; keep the menu then.
      if (menuRef.current && event.relatedTarget instanceof Node && menuRef.current.contains(event.relatedTarget)) return
      setTimeout(() => {
        if (!menuRef.current?.contains(document.activeElement)) setPos(null)
      }, 120)
    }
    editor.on('selectionUpdate', update)
    editor.on('focus', update)
    editor.on('blur', onBlur)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('focus', update)
      editor.off('blur', onBlur)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [editor])

  if (!pos) return null

  const run = (how: { action?: RewriteAction; instruction?: string }) => {
    onRewrite(how)
    setCustom(null)
    setPos(null)
  }

  return (
    <div
      ref={menuRef}
      role="toolbar"
      aria-label="AI actions for the selection"
      className="fixed z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border p-1 shadow-lg"
      style={{ top: pos.top, left: pos.left, background: 'var(--navy, #0D1B2A)', borderColor: 'rgba(255,255,255,0.08)' }}
      onMouseDown={(e) => {
        // Keep the editor selection while clicking buttons.
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault()
      }}
    >
      {custom === null ? (
        <>
          <span className="flex items-center gap-1 px-1.5 text-[11.5px] font-semibold" style={{ color: 'var(--gold, #C9972B)' }}>
            <Sparkle size={12} weight="fill" /> AI
          </span>
          {MENU_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={disabled}
              title={a.hint}
              onClick={() => run({ action: a.id })}
              className="cursor-pointer whitespace-nowrap rounded-lg px-2 py-1 text-[12px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              {a.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setCustom('')}
            className="cursor-pointer whitespace-nowrap rounded-lg px-2 py-1 text-[12px] font-medium text-white/85 hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            Ask AI...
          </button>
        </>
      ) : (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            if (custom.trim()) run({ instruction: custom.trim() })
          }}
        >
          <input
            autoFocus
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setCustom(null)
            }}
            placeholder="e.g. make this a numbered list of particulars"
            className="h-7 w-[300px] rounded-lg bg-white/10 px-2 text-[12.5px] text-white outline-none placeholder:text-white/45"
          />
          <button type="submit" aria-label="Rewrite" className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-white hover:bg-white/10">
            <CaretRight size={14} weight="bold" />
          </button>
        </form>
      )}
    </div>
  )
}
