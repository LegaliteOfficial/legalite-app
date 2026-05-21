'use client'

/**
 * RichEditor
 * ----------
 * TipTap-powered rich text editor for legal drafting.
 *
 * Defaults are optimised for Ghana legal documents:
 *   - Times New Roman, 13pt, 1.8 line-height
 *   - Toolbar with B / I / U / Strike, H1-H3, lists, alignment (incl. justify),
 *     blockquote, undo / redo
 *   - HTML in / HTML out so it slots in wherever we currently use
 *     dangerouslySetInnerHTML
 *
 * Usage:
 *   <RichEditor html={editorHTML} onChange={setEditorHTML} />
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Undo2,
  Redo2,
  Pilcrow,
} from 'lucide-react'

interface RichEditorProps {
  html: string
  onChange?: (html: string) => void
  placeholder?: string
  readOnly?: boolean
  minHeight?: number
  className?: string
}

/**
 * Group of toolbar buttons rendered as a horizontal row with a divider.
 * Single source of truth for button styling so behaviour stays consistent.
 */
function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-8 w-8 rounded flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: active ? 'rgba(201,151,43,0.12)' : 'transparent',
        color: active ? 'var(--gold)' : '#374151',
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = 'rgba(13,27,42,0.04)'
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />
}

export function RichEditor({
  html,
  onChange,
  placeholder = 'Start typing...',
  readOnly = false,
  minHeight = 500,
  className = '',
}: RichEditorProps) {
  const editor = useEditor({
    // Avoid SSR hydration mismatch — TipTap recommends false for Next.js App Router
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable starter-kit's built-in heading because we want full control
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: html,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none',
        style: `font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.8; color: #1a1a1a; min-height: ${minHeight}px; padding: 24px;`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML())
    },
  })

  // Sync external html prop changes into the editor (e.g. when the user
  // picks a new template or case). We compare the editor's current HTML
  // against incoming html to avoid wiping user-typed content during normal
  // typing onUpdate cycles.
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (html !== current) {
      editor.commands.setContent(html ?? '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, editor])

  // Sync readOnly prop changes
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!readOnly)
  }, [editor, readOnly])

  const setHeading = useCallback(
    (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run(),
    [editor],
  )

  if (!editor) {
    // Initial server render / hydration — render a static shell so the
    // page doesn't shift when TipTap mounts.
    return (
      <div
        className={`rounded-xl ${className}`}
        style={{
          fontFamily: "'Times New Roman', serif",
          fontSize: '13pt',
          lineHeight: '1.8',
          minHeight,
          padding: '24px',
          color: '#9CA3AF',
        }}
      >
        {placeholder}
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${className}`} style={{ background: 'white' }}>
      {/* Toolbar */}
      {!readOnly && (
        <div
          className="flex items-center gap-0.5 px-3 py-2 border-b flex-wrap"
          style={{ borderColor: 'var(--border)', background: 'rgba(13,27,42,0.02)' }}
        >
          {/* Inline formatting */}
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Cmd/Ctrl + B)"
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Cmd/Ctrl + I)"
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Cmd/Ctrl + U)"
          >
            <UnderlineIcon size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <Strikethrough size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Block / heading */}
          <ToolbarButton
            active={editor.isActive('paragraph')}
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Paragraph"
          >
            <Pilcrow size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => setHeading(1)}
            title="Heading 1"
          >
            <Heading1 size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => setHeading(2)}
            title="Heading 2"
          >
            <Heading2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => setHeading(3)}
            title="Heading 3"
          >
            <Heading3 size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet list"
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered list"
          >
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            <Quote size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Align left"
          >
            <AlignLeft size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Align center"
          >
            <AlignCenter size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Align right"
          >
            <AlignRight size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: 'justify' })}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justify"
          >
            <AlignJustify size={14} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* History */}
          <ToolbarButton
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo (Cmd/Ctrl + Z)"
          >
            <Undo2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo (Cmd/Ctrl + Shift + Z)"
          >
            <Redo2 size={14} />
          </ToolbarButton>
        </div>
      )}

      {/* Editor surface */}
      <EditorContent editor={editor} />
    </div>
  )
}
