/**
 * Detect how an attachment should be previewed based on its MIME type
 * (preferred) and filename extension (fallback). Used by the preview
 * dialog to pick the right viewer and by the file list to render the
 * right icon.
 */

import { File, FileZip, FileAudio, FileCode, FileImage, FileXls, FileText, FileVideo, PresentationChart, type Icon } from '@phosphor-icons/react'
export type FileKind =
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'text'
  | 'office-doc'
  | 'office-sheet'
  | 'office-slide'
  | 'archive'
  | 'other'

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif', 'avif', 'ico']
const VIDEO_EXTS = ['mp4', 'mov', 'webm', 'm4v', 'mkv', 'avi', 'ogv']
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus']
const TEXT_EXTS = [
  'txt', 'md', 'log', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'ini',
  'sh', 'bash', 'zsh', 'env',
  'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'c', 'cc', 'cpp', 'h', 'hpp',
  'sql', 'graphql', 'gql',
  'css', 'scss', 'less', 'html', 'htm', 'vue', 'svelte',
  'gitignore', 'editorconfig', 'prettierrc', 'eslintrc',
]
const OFFICE_DOC_EXTS = ['doc', 'docx', 'odt', 'rtf', 'pages']
const OFFICE_SHEET_EXTS = ['xls', 'xlsx', 'ods', 'numbers']
const OFFICE_SLIDE_EXTS = ['ppt', 'pptx', 'odp', 'key']
const ARCHIVE_EXTS = ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz']

export function getFileKind(name: string, mime?: string | null): FileKind {
  const m = (mime ?? '').toLowerCase()
  const ext = extOf(name)

  if (m === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (m.startsWith('image/') || IMAGE_EXTS.includes(ext)) return 'image'
  if (m.startsWith('video/') || VIDEO_EXTS.includes(ext)) return 'video'
  if (m.startsWith('audio/') || AUDIO_EXTS.includes(ext)) return 'audio'

  // Office suites — MIME first since extensions can lie (e.g. zipped pptx
  // reports as application/zip on some browsers without the correct ext).
  if (
    m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    m === 'application/msword' ||
    OFFICE_DOC_EXTS.includes(ext)
  ) return 'office-doc'
  if (
    m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    m === 'application/vnd.ms-excel' ||
    OFFICE_SHEET_EXTS.includes(ext)
  ) return 'office-sheet'
  if (
    m === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    m === 'application/vnd.ms-powerpoint' ||
    OFFICE_SLIDE_EXTS.includes(ext)
  ) return 'office-slide'

  if (
    m === 'application/zip' ||
    m === 'application/x-rar-compressed' ||
    m === 'application/x-7z-compressed' ||
    m === 'application/x-tar' ||
    m === 'application/gzip' ||
    ARCHIVE_EXTS.includes(ext)
  ) return 'archive'

  // Text family is checked last so MIME types like text/csv still win above
  // file-extension checks (CSV technically matches both 'office-sheet' if
  // we'd put it there; keeping CSV in TEXT_EXTS handles that).
  if (m.startsWith('text/') || TEXT_EXTS.includes(ext)) return 'text'

  return 'other'
}

export function iconForKind(kind: FileKind): Icon {
  switch (kind) {
    case 'pdf':
    case 'office-doc':  return FileText
    case 'image':       return FileImage
    case 'video':       return FileVideo
    case 'audio':       return FileAudio
    case 'text':        return FileCode
    case 'office-sheet':return FileXls
    case 'office-slide':return PresentationChart
    case 'archive':     return FileZip
    case 'other':       return File
  }
}

/**
 * True when the kind can be previewed in-browser without an external
 * converter (Google Docs viewer, server-side renderer, etc.).
 *
 * Office and archive formats fall through to the download fallback in
 * the preview dialog.
 */
export function isPreviewable(kind: FileKind): boolean {
  return kind === 'pdf'
    || kind === 'image'
    || kind === 'video'
    || kind === 'audio'
    || kind === 'text'
}

function extOf(name: string): string {
  const idx = name.lastIndexOf('.')
  if (idx < 0 || idx === name.length - 1) return ''
  return name.slice(idx + 1).toLowerCase()
}
