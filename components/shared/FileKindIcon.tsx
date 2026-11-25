import type { IconProps } from '@phosphor-icons/react'
import {
  File,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  FileXls,
  FileZip,
  PresentationChart,
} from '@phosphor-icons/react'
import type { FileKind } from '@/lib/attachments/file-kind'

/**
 * The icon for a kind of file. Written as a switch of JSX elements, not a
 * looked-up component, so no component is created while rendering.
 */
export function FileKindIcon({ kind, ...props }: { kind: FileKind } & IconProps) {
  switch (kind) {
    case 'pdf':
    case 'office-doc':
      return <FileText {...props} />
    case 'image':
      return <FileImage {...props} />
    case 'video':
      return <FileVideo {...props} />
    case 'audio':
      return <FileAudio {...props} />
    case 'text':
      return <FileCode {...props} />
    case 'office-sheet':
      return <FileXls {...props} />
    case 'office-slide':
      return <PresentationChart {...props} />
    case 'archive':
      return <FileZip {...props} />
    case 'other':
      return <File {...props} />
  }
}
