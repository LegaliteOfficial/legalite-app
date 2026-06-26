/**
 * AI settings — local persisted store
 * ===================================
 *
 * Firm-wide preferences for the AI assistant: how answers are cited,
 * the default answering mode, and which sources the retrieval step is
 * allowed to draw on. These shape every call the frontend makes to the
 * NestJS-routed AI service — they're sent as request options, never
 * used to call a model directly (see docs/AI.md).
 *
 * The settings map onto concepts the AI backend already exposes:
 *   - citation style  -> how `citations` / `sources_used` are rendered
 *   - default mode    -> answer verbosity + whether reasoning shows
 *   - knowledge base  -> the `source_scope` the retriever may use:
 *                        `global` (Ghana statutes + public case law)
 *                        and/or `tenant_private` (the firm's own docs
 *                        and past matters).
 *
 * Local persistence mirrors the other -local stores; when the backend
 * grows a firm-settings table these route through a mutation and the
 * read shape stays put.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CitationStyle = 'ghana' | 'oscola' | 'bluebook' | 'plain'
export type AnswerMode = 'balanced' | 'concise' | 'detailed' | 'drafting'

export interface AiSettings {
  // ── Citations ──────────────────────────────────────────────
  citationStyle: CitationStyle
  /** Show the quoted excerpt under each cited authority. */
  showCitationExcerpts: boolean
  /** Always list the sources panel, even for high-confidence answers. */
  alwaysShowSources: boolean

  // ── Default mode ───────────────────────────────────────────
  defaultMode: AnswerMode
  /** Surface the confidence badge (high / medium / low) on answers. */
  showConfidence: boolean
  /** Surface the model's reasoning summary by default. */
  showReasoning: boolean

  // ── Firm knowledge base ────────────────────────────────────
  /** Let retrieval search the firm's own uploaded documents. */
  searchFirmDocuments: boolean
  /** Let retrieval surface the firm's past matters as precedent. */
  includeFirmPrecedents: boolean
  /** Restrict answers to verified / published authorities only. */
  restrictToVerified: boolean

  // ── Safety ─────────────────────────────────────────────────
  /** Always append the "not legal advice" disclaimer. */
  alwaysShowDisclaimer: boolean
}

interface AiSettingsStore {
  settings: AiSettings
  revision: number
  updateSettings: (patch: Partial<AiSettings>) => void
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  citationStyle: 'ghana',
  showCitationExcerpts: true,
  alwaysShowSources: true,
  defaultMode: 'balanced',
  showConfidence: true,
  showReasoning: false,
  searchFirmDocuments: true,
  includeFirmPrecedents: true,
  restrictToVerified: false,
  alwaysShowDisclaimer: true,
}

export const useAiSettingsStore = create<AiSettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_AI_SETTINGS,
      revision: 0,
      updateSettings: (patch) =>
        set((prev) => ({
          settings: { ...prev.settings, ...patch },
          revision: prev.revision + 1,
        })),
    }),
    {
      name: 'll:ai-settings',
      partialize: (state) => ({ settings: state.settings }),
      skipHydration: true,
    },
  ),
)
