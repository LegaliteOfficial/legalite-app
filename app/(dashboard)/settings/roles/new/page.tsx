'use client'

/**
 * Create-custom-role page — composition root.
 *
 * Sticky top bar at the top, two-column body (left scroll-spy nav,
 * right form). State + handlers live in the hook; each section is its
 * own component.
 */

import { PERMISSION_SECTIONS, TEMPLATE_OPTIONS } from './_constants'
import { useNewRoleState } from './_hooks/use-new-role-state'
import { PermissionSectionCard } from './_components/PermissionSectionCard'
import { Sidebar } from './_components/Sidebar'
import { TopBar } from './_components/TopBar'
import { Field } from './_components/primitives/Field'
import { Section } from './_components/primitives/Section'

export default function CreateRolePage() {
  const state = useNewRoleState()

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--surface-card)' }}
    >
      <TopBar isCreating={state.isCreating} onCreate={state.handleCreate} />

      <div className="px-6 py-8 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8 max-w-6xl mx-auto">
        <Sidebar
          activeId={state.activeId}
          grantedCounts={state.grantedCounts}
        />

        <div className="space-y-6 min-w-0">
          <Section
            id="role-details"
            title="Role details"
            description="Provide a name and description so anyone in the firm understands what this role does."
          >
            <Field label="Role name" required>
              <input
                value={state.roleName}
                onChange={(e) => state.setRoleName(e.target.value)}
                placeholder="e.g. Junior Associate"
                className="h-10 w-full rounded-md border px-3 text-sm bg-white transition-colors focus:outline-none focus:border-yellow-600"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--navy)',
                }}
              />
            </Field>
            <Field label="Role description" required>
              <textarea
                value={state.roleDescription}
                onChange={(e) => state.setRoleDescription(e.target.value)}
                placeholder="Describe in one or two sentences what this role can do and who it’s for."
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm bg-white transition-colors focus:outline-none focus:border-yellow-600 resize-y"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--navy)',
                }}
              />
            </Field>
          </Section>

          <Section
            id="template"
            title="Choose a role template"
            description="Select an existing role as a starting point. We’ll pre-fill the permissions below and you can fine-tune them."
          >
            <Field label="Template">
              <select
                value={state.template}
                onChange={(e) => state.handleTemplateChange(e.target.value)}
                className="h-10 w-full rounded-md border bg-white px-3 pr-9 text-sm transition-colors focus:outline-none focus:border-yellow-600 appearance-none"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--navy)',
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2.25\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '12px',
                }}
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          {PERMISSION_SECTIONS.map((section) => (
            <PermissionSectionCard
              key={section.id}
              section={section}
              permissions={state.permissions}
              counts={state.grantedCounts[section.id]}
              onTogglePermission={state.togglePermission}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
