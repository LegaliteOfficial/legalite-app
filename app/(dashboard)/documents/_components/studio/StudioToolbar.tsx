'use client'

/**
 * Formatting toolbar for the drafting studio. Reads the editor's active
 * state through `useEditorState`, so it re-renders on selection changes
 * without re-rendering the canvas.
 */

import { useRef, type ReactNode } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  Eraser,
  Highlighter,
  ImageSquare,
  List,
  ListNumbers,
  Minus,
  Quotes,
  Rows,
  Columns,
  Table,
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  Trash,
  FileArrowDown,
  LineSegments,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DOCUMENT_FONTS, FONT_SIZES_PT, LINE_HEIGHTS, fontFamily } from '@/lib/documents/design'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const TEXT_COLOURS = ['#1A1A1A', '#4A4A4A', '#0D1B2A', '#1F3A8A', '#7A1E2C', '#B42318', '#1F4D3A', '#A07A1E']
const HIGHLIGHTS = ['#FFF3B0', '#D9F2E3', '#DCEBFF', '#FDE2E1', '#EFE3FF']

const BLOCK_ITEMS: Record<string, string> = {
  paragraph: 'Normal text',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
}
const FONT_ITEMS: Record<string, string> = {
  default: 'Document font',
  ...Object.fromEntries(DOCUMENT_FONTS.map((f) => [f.id, f.label])),
}
const SIZE_ITEMS: Record<string, string> = {
  default: 'Size',
  ...Object.fromEntries(FONT_SIZES_PT.map((s) => [String(s), `${s} pt`])),
}

export function StudioToolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null)

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const style = e.getAttributes('textStyle') as { fontFamily?: string; fontSize?: string }
      const font = DOCUMENT_FONTS.find((f) => f.family === style.fontFamily)?.id ?? 'default'
      const size = style.fontSize ? String(parseFloat(style.fontSize)) : 'default'
      return {
        block: e.isActive('heading', { level: 1 })
          ? 'h1'
          : e.isActive('heading', { level: 2 })
            ? 'h2'
            : e.isActive('heading', { level: 3 })
              ? 'h3'
              : 'paragraph',
        font,
        size: SIZE_ITEMS[size] ? size : 'default',
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        bullet: e.isActive('bulletList'),
        ordered: e.isActive('orderedList'),
        quote: e.isActive('blockquote'),
        align: (['left', 'center', 'right', 'justify'] as const).find((a) => e.isActive({ textAlign: a })) ?? 'left',
        inTable: e.isActive('table'),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      }
    },
  })

  const chain = () => editor.chain().focus()

  const setBlock = (v: string | null) => {
    if (v === 'h1' || v === 'h2' || v === 'h3') chain().setHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run()
    else chain().setParagraph().run()
  }

  const insertImage = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Choose an image file.'); return }
    if (file.size > MAX_IMAGE_BYTES) { toast.error('Images must be 2 MB or smaller.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') chain().setImage({ src: reader.result, alt: file.name }).run()
    }
    reader.onerror = () => toast.error('Could not read that image.')
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b px-3 py-1.5"
      style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
      role="toolbar"
      aria-label="Formatting"
    >
      <Group>
        <Btn title="Undo (⌘Z)" disabled={!state.canUndo} onClick={() => chain().undo().run()}><ArrowUUpLeft size={15} /></Btn>
        <Btn title="Redo (⇧⌘Z)" disabled={!state.canRedo} onClick={() => chain().redo().run()}><ArrowUUpRight size={15} /></Btn>
      </Group>
      <Divider />

      <Select items={BLOCK_ITEMS} value={state.block} onValueChange={setBlock}>
        <SelectTrigger size="sm" className="w-[120px] text-[12.5px]" aria-label="Text style"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(BLOCK_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select
        items={FONT_ITEMS}
        value={state.font}
        onValueChange={(v) => {
          const f = DOCUMENT_FONTS.find((x) => x.id === v)
          if (f) chain().setFontFamily(f.family).run()
          else chain().unsetFontFamily().run()
        }}
      >
        <SelectTrigger size="sm" className="ml-1 w-[136px] text-[12.5px]" aria-label="Font"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Document font</SelectItem>
          {DOCUMENT_FONTS.map((f) => (
            <SelectItem key={f.id} value={f.id}><span style={{ fontFamily: fontFamily(f.id) }}>{f.label}</span></SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={SIZE_ITEMS}
        value={state.size}
        onValueChange={(v) => (v && v !== 'default' ? chain().setFontSize(`${v}pt`).run() : chain().unsetFontSize().run())}
      >
        <SelectTrigger size="sm" className="ml-1 w-[78px] text-[12.5px]" aria-label="Font size"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          {FONT_SIZES_PT.map((s) => <SelectItem key={s} value={String(s)}>{s} pt</SelectItem>)}
        </SelectContent>
      </Select>
      <Divider />

      <Group>
        <Btn title="Bold (⌘B)" active={state.bold} onClick={() => chain().toggleBold().run()}><TextB size={15} weight="bold" /></Btn>
        <Btn title="Italic (⌘I)" active={state.italic} onClick={() => chain().toggleItalic().run()}><TextItalic size={15} /></Btn>
        <Btn title="Underline (⌘U)" active={state.underline} onClick={() => chain().toggleUnderline().run()}><TextUnderline size={15} /></Btn>
        <Btn title="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}><TextStrikethrough size={15} /></Btn>
        <SwatchMenu
          title="Text colour"
          icon={<span className="text-[13px] font-bold underline decoration-2 underline-offset-2">A</span>}
          swatches={TEXT_COLOURS}
          onPick={(c) => chain().setColor(c).run()}
          onClear={() => chain().unsetColor().run()}
          clearLabel="Automatic"
        />
        <SwatchMenu
          title="Highlight"
          icon={<Highlighter size={15} />}
          swatches={HIGHLIGHTS}
          onPick={(c) => chain().setHighlight({ color: c }).run()}
          onClear={() => chain().unsetHighlight().run()}
          clearLabel="No highlight"
        />
      </Group>
      <Divider />

      <Group>
        <Btn title="Align left" active={state.align === 'left'} onClick={() => chain().setTextAlign('left').run()}><TextAlignLeft size={15} /></Btn>
        <Btn title="Centre" active={state.align === 'center'} onClick={() => chain().setTextAlign('center').run()}><TextAlignCenter size={15} /></Btn>
        <Btn title="Align right" active={state.align === 'right'} onClick={() => chain().setTextAlign('right').run()}><TextAlignRight size={15} /></Btn>
        <Btn title="Justify" active={state.align === 'justify'} onClick={() => chain().setTextAlign('justify').run()}><TextAlignJustify size={15} /></Btn>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Btn title="Line spacing" onClick={() => undefined}><LineSegments size={15} /></Btn>} />
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel className="text-[11px]">Line spacing</DropdownMenuLabel>
            <DropdownMenuItem className="text-[12.5px]" onClick={() => chain().unsetLineHeight().run()}>Document default</DropdownMenuItem>
            {LINE_HEIGHTS.map((h) => (
              <DropdownMenuItem key={h} className="text-[12.5px]" onClick={() => chain().setLineHeight(String(h)).run()}>
                {h.toFixed(h % 1 ? 2 : 1).replace(/0$/, '')}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Group>
      <Divider />

      <Group>
        <Btn title="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}><List size={15} /></Btn>
        <Btn title="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}><ListNumbers size={15} /></Btn>
        <Btn title="Quotation" active={state.quote} onClick={() => chain().toggleBlockquote().run()}><Quotes size={15} /></Btn>
      </Group>
      <Divider />

      <Group>
        <Btn title="Insert table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table size={15} /></Btn>
        <Btn title="Insert image" onClick={() => fileRef.current?.click()}><ImageSquare size={15} /></Btn>
        <Btn title="Horizontal line" onClick={() => chain().setHorizontalRule().run()}><Minus size={15} /></Btn>
        <Btn title="Page break (⌘Enter)" onClick={() => chain().setPageBreak().run()}><FileArrowDown size={15} /></Btn>
        <Btn title="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}><Eraser size={15} /></Btn>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) insertImage(file)
            e.target.value = ''
          }}
        />
      </Group>

      {state.inTable && (
        <>
          <Divider />
          <Group>
            <Btn title="Add row below" onClick={() => chain().addRowAfter().run()}><Rows size={15} /></Btn>
            <Btn title="Add column right" onClick={() => chain().addColumnAfter().run()}><Columns size={15} /></Btn>
            <Btn title="Delete row" onClick={() => chain().deleteRow().run()}><Rows size={15} style={{ color: '#B42318' }} /></Btn>
            <Btn title="Delete column" onClick={() => chain().deleteColumn().run()}><Columns size={15} style={{ color: '#B42318' }} /></Btn>
            <Btn title="Delete table" onClick={() => chain().deleteTable().run()}><Trash size={15} style={{ color: '#B42318' }} /></Btn>
          </Group>
        </>
      )}
    </div>
  )
}

// ── Primitives ───────────────────────────────────────────────────────────

function Btn({
  title, onClick, active, disabled, children, ...rest
}: {
  title: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor selection: act on mousedown and cancel the focus change.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-sunken)] disabled:cursor-not-allowed disabled:opacity-35"
      style={{
        background: active ? 'var(--gold-muted)' : undefined,
        color: active ? 'var(--gold-dark)' : 'var(--text-secondary)',
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

function SwatchMenu({
  title, icon, swatches, onPick, onClear, clearLabel,
}: {
  title: string
  icon: ReactNode
  swatches: string[]
  onPick: (colour: string) => void
  onClear: () => void
  clearLabel: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Btn title={title} onClick={() => undefined}>{icon}</Btn>} />
      <DropdownMenuContent align="start" className="w-48 p-2">
        <DropdownMenuLabel className="px-1 text-[11px]">{title}</DropdownMenuLabel>
        <div className="grid grid-cols-8 gap-1 px-1 py-1">
          {swatches.map((c) => (
            <DropdownMenuItem
              key={c}
              onClick={() => onPick(c)}
              className="h-5 w-5 rounded-sm border p-0"
              style={{ background: c, borderColor: 'var(--border-default)' }}
              aria-label={c}
            />
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[12.5px]" onClick={onClear}>{clearLabel}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Group({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>
}

function Divider() {
  return <div aria-hidden className="mx-1.5 h-5 w-px" style={{ background: 'var(--border-soft)' }} />
}
