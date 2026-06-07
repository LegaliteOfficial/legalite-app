'use client'

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Strikethrough,
  Underline,
} from 'lucide-react'

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
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} title="Italic (⌘I)">
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('underline')} title="Underline (⌘U)">
          <Underline size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('strikeThrough')} title="Strikethrough">
          <Strikethrough size={14} />
        </ToolbarBtn>
      </ToolbarGroup>
      <ToolbarDiv />
      <ToolbarGroup>
        <ToolbarBtn onClick={() => exec('formatBlock', 'p')} title="Paragraph">
          <Pilcrow size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'h1')} title="Heading 1">
          <Heading1 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2">
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('formatBlock', 'h3')} title="Heading 3">
          <Heading3 size={14} />
        </ToolbarBtn>
      </ToolbarGroup>
      <ToolbarDiv />
      <ToolbarGroup>
        <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Numbered list">
          <ListOrdered size={14} />
        </ToolbarBtn>
      </ToolbarGroup>
      <ToolbarDiv />
      <ToolbarGroup>
        <ToolbarBtn onClick={() => exec('justifyLeft')} title="Align left">
          <AlignLeft size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyCenter')} title="Align center">
          <AlignCenter size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyRight')} title="Align right">
          <AlignRight size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyFull')} title="Justify">
          <AlignJustify size={14} />
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
