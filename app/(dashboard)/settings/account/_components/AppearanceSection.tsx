'use client'

import { CornersIn, Sidebar } from '@phosphor-icons/react'
import { Card } from './primitives/Card'
import { SaveButton } from './primitives/SaveButton'
import { SectionLabel } from './primitives/SectionLabel'
import { ToggleRow } from './primitives/ToggleRow'
import type { AccountState } from '../_hooks/use-account-state'

export function AppearanceSection({ state }: { state: AccountState }) {
  const { appearance, setAppearance, saveAppearance } = state
  return (
    <Card title="Appearance" subtitle="Customize how LegaLite looks and feels.">
      <div className="max-w-lg space-y-6">
        <div>
          <SectionLabel>Theme</SectionLabel>
          <div className="flex gap-3 mt-2">
            {(['light', 'dark'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => setAppearance((a) => ({ ...a, theme }))}
                className="flex-1 rounded-lg border-2 p-4 text-center text-sm font-medium transition-all"
                style={{
                  borderColor:
                    appearance.theme === theme ? '#C9972B' : '#E5E7EB',
                  background:
                    appearance.theme === theme
                      ? 'rgba(201,151,43,0.04)'
                      : 'white',
                  color: appearance.theme === theme ? '#C9972B' : '#6B7280',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg border"
                    style={{
                      background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                      borderColor: theme === 'light' ? '#E5E7EB' : '#374151',
                    }}
                  />
                  {theme === 'light' ? 'Light' : 'Dark'}
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: '#9CA3AF' }}>
            Dark mode is coming soon.
          </p>
        </div>

        <div>
          <SectionLabel>
            <div className="flex items-center gap-1.5">
              <Sidebar size={12} /> Sidebar Position
            </div>
          </SectionLabel>
          <div className="flex gap-3 mt-2">
            {(['left', 'right'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() =>
                  setAppearance((a) => ({ ...a, sidebarPosition: pos }))
                }
                className="flex-1 rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all capitalize"
                style={{
                  borderColor:
                    appearance.sidebarPosition === pos
                      ? '#C9972B'
                      : '#E5E7EB',
                  background:
                    appearance.sidebarPosition === pos
                      ? 'rgba(201,151,43,0.04)'
                      : 'white',
                  color:
                    appearance.sidebarPosition === pos ? '#C9972B' : '#6B7280',
                }}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <ToggleRow
          icon={CornersIn}
          label="Compact Mode"
          description="Reduce spacing and padding for denser information display."
          checked={appearance.compactMode}
          onToggle={() =>
            setAppearance((a) => ({ ...a, compactMode: !a.compactMode }))
          }
        />

        <div className="pt-2">
          <SaveButton
            onClick={saveAppearance}
            isPending={false}
            label="Save Appearance"
            pendingLabel="Saving..."
          />
        </div>
      </div>
    </Card>
  )
}
