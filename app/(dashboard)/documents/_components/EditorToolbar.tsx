'use client'

import { TextAlignCenter, TextAlignJustify, TextAlignLeft, TextAlignRight, TextB, TextHOne, TextHTwo, TextHThree, TextItalic, List, ListNumbers, Paragraph, TextStrikethrough, TextUnderline } from '@phosphor-icons/react'
/**
 * Formatting toolbar — sits between the editor header and the canvas.
 * Buttons fire `document.execCommand(...)` via the parent's `exec`
 * callback. Groups are separated by hairline dividers for visual
 * rhythm: marks · blocks · lists · alignment.
 */
export function EditorToolbar({
  exec,
}: {
  exec: (command: string, value?: string) => void
}) {
  return (
    <div
      className="flex items-center gap-0.5 px-3 py-1.5 border-b flex-wrap shrink-0"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      <ToolbarGroup>
        <ToolbarBtn onClick={() => exec('bold')} title="Bold (⌘B)">
          <TextB size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} title="Italic (⌘I)">
          <TextItalic size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('underline')} title="Underline (⌘U)">
          <TextUnderline size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('strikeThrough')} title="Strikethrough">
          <TextStrikethrough size={14} />
        </ToolbarBtn>
      </ToolbarGroup>
      <ToolbarDiv />
      <ToolbarGroup>
        <ToolbarBtn onClick={() => exec('formatBlock', 'p')} title="Paragraph">
          <Paragraph size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'h1')} title="Heading 1">
          <TextHOne size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2">
          <TextHTwo size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'h3')} title="Heading 3">
          <TextHThree size={14} />
        </ToolbarBtn>
      </ToolbarGroup>
      <ToolbarDiv />
      <ToolbarGroup>
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Numbered list">
          <ListNumbers size={14} />
        </ToolbarBtn>
      </ToolbarGroup>
      <ToolbarDiv />
      <ToolbarGroup>
        <ToolbarBtn onClick={() => exec('justifyLeft')} title="Align left">
          <TextAlignLeft size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyCenter')} title="Align center">
          <TextAlignCenter size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyRight')} title="Align right">
          <TextAlignRight size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyFull')} title="Justify">
          <TextAlignJustify size={14} />
        </ToolbarBtn>
      </ToolbarGroup>
    </div>
  )
}

// ── Toolbar primitives ────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      // onMouseDown + preventDefault so the editor selection isn't lost
      // when the user clicks a formatting button.
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className="h-8 w-8 rounded-md flex items-center justify-center transition-colors cursor-pointer"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-sunken)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
    >
      {children}
    </button>
  )
}

/** Groups related toolbar buttons so the visual rhythm reads as
 *  bold/italic/… | h1/h2/… | list/list-ordered | align-… */
function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>
}

function ToolbarDiv() {
  return (
    <div
      aria-hidden
      className="w-px h-5 mx-1.5"
      style={{ background: 'var(--border-soft)' }}
    />
  )
}
