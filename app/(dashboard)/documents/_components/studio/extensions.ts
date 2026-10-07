/**
 * TipTap configuration for the drafting studio.
 *
 * Everything the editor can produce must also print: marks and nodes map
 * to plain HTML (inline styles for font, size, colour, line height) that
 * the shared document stylesheet and the PDF renderer understand.
 */

import { Node, mergeAttributes, type Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import { Color, FontFamily, FontSize, LineHeight, TextStyle } from '@tiptap/extension-text-style'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /** Starts the following content on a new page. */
      setPageBreak: () => ReturnType
    }
  }
}

/**
 * Forced page break. Prints as `break-after: page`; on screen it shows as
 * a labelled dashed rule (see the studio canvas styles).
 */
export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [{ tag: 'div[data-page-break]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-page-break': '', class: 'll-page-break' })]
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) =>
          chain().insertContent({ type: this.name }).createParagraphNear().run(),
    }
  },

  addKeyboardShortcuts() {
    return { 'Mod-Enter': () => this.editor.commands.setPageBreak() }
  },
})

export function studioExtensions(placeholder: string): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true },
    }),
    TextStyle,
    FontFamily,
    FontSize,
    LineHeight,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Image.configure({ allowBase64: true, inline: false }),
    TableKit.configure({ table: { resizable: false } }),
    PageBreak,
    Placeholder.configure({ placeholder }),
  ]
}
