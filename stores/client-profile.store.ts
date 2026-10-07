/**
 * Client profile — UI state
 * =========================
 *
 * Shared between the profile header and the correspondence composer:
 * the header's Email / WhatsApp buttons pick the composer's channel and
 * ask it to take focus. Also holds the retry key for failed sections.
 * Server data stays in Apollo.
 */

import { create } from 'zustand'

/** Channels a firm member can start a conversation on from the profile. */
export type MessageChannel = 'email' | 'whatsapp'

interface ClientProfileState {
  channel: MessageChannel
  /** Bumped when the header asks the composer to scroll into view and focus. */
  focusRequest: number
  /** Feeds the suspense query keys so "Try again" starts a fresh request. */
  retryNonce: number
  setChannel: (channel: MessageChannel) => void
  compose: (channel: MessageChannel) => void
  retry: () => void
}

export const useClientProfileStore = create<ClientProfileState>((set) => ({
  channel: 'email',
  focusRequest: 0,
  retryNonce: 0,
  setChannel: (channel) => set({ channel }),
  compose: (channel) => set((s) => ({ channel, focusRequest: s.focusRequest + 1 })),
  retry: () => set((s) => ({ retryNonce: s.retryNonce + 1 })),
}))
