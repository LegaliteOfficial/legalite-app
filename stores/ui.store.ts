import { create } from 'zustand'

type Modal =
  | { type: 'addClient' }
  | { type: 'editClient'; id: string }
  | { type: 'viewClient'; id: string }
  | { type: 'addCase' }
  | { type: 'editCase'; id: string }
  | { type: 'viewCase'; id: string }
  | { type: 'addTask' }
  | { type: 'editTask'; id: string }
  | { type: 'addDocument' }
  | { type: 'editDocument'; id: string }
  | { type: 'addInvoice' }
  | { type: 'editInvoice'; id: string }
  | { type: 'confirmDelete'; entity: string; id: string; name: string }
  | null

interface UIStore {
  modal: Modal
  sidebarCollapsed: boolean
  openModal: (modal: NonNullable<Modal>) => void
  closeModal: () => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  modal: null,
  sidebarCollapsed: false,

  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
