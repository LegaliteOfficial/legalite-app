import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Tag store — dev-side persistence for case tags.
 *
 * Tags don't have a backend table yet (will live in a `tags` table joined
 * to cases by a many-to-many table once the backend ships them). Until
 * that lands, we persist tags to localStorage so the user can experience
 * the full create / pick / filter flow end-to-end during dev.
 *
 * When the backend is wired:
 *   1. Replace `useTagsStore` consumers with a `useTags()` hook backed by
 *      Apollo.
 *   2. Drop this file. The Tag type can move into `types/index.ts`.
 */

export interface Tag {
  id: string
  name: string
  color: string // hex
}

/** Preset palette shown in the colour picker on the Tag settings dialog. */
export const TAG_COLOURS = [
  '#0EA5E9', // sky
  '#22C55E', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6B7280', // gray
  '#C9972B', // brand gold
] as const

interface TagsStore {
  tags: Tag[]
  addTag: (name: string, color: string) => Tag | null
  updateTag: (id: string, patch: Partial<Omit<Tag, 'id'>>) => void
  removeTag: (id: string) => void
}

function genId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useTagsStore = create<TagsStore>()(
  persist(
    (set, get) => ({
      tags: [],

      addTag: (name, color) => {
        const trimmed = name.trim()
        if (!trimmed) return null
        // Reject case-insensitive duplicates so the firm doesn't end up
        // with "Estate" and "estate" both lingering.
        const existing = get().tags.find(
          (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
        )
        if (existing) return null
        const tag: Tag = { id: genId(), name: trimmed, color }
        set((s) => ({ tags: [...s.tags, tag] }))
        return tag
      },

      updateTag: (id, patch) => {
        set((s) => ({
          tags: s.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }))
      },

      removeTag: (id) => {
        set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }))
      },
    }),
    {
      name: 'll:tags',
      // Persist just the array — methods don't need round-tripping.
      partialize: (state) => ({ tags: state.tags }),
    },
  ),
)
