'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCreateFirmRole } from '@/hooks/use-firm-roles'
import {
  ALWAYS_ON,
  DEFAULT_ENABLED,
  PERMISSION_SECTIONS,
  SIDEBAR_ITEMS,
  TEMPLATE_OPTIONS,
  TEMPLATE_PERMISSIONS,
} from '../_constants'
import type { GrantedCount } from '../_types'

/**
 * Builds the initial permissions map — default-enabled checks plus the
 * always-on locked section. Recomputed when a template is picked.
 */
function buildInitialPermissions(): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const section of PERMISSION_SECTIONS) {
    for (const group of section.groups) {
      for (const p of group.permissions) {
        map[p.id] = DEFAULT_ENABLED.has(p.id) || ALWAYS_ON.has(p.id)
      }
    }
  }
  return map
}

/**
 * New-role page state: name + description fields, template choice,
 * per-permission toggle map, scroll-spy active id, and the create
 * handler that POSTs to the role-create mutation.
 */
export function useNewRoleState() {
  const router = useRouter()
  const createRole = useCreateFirmRole()

  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [template, setTemplate] = useState('')
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    buildInitialPermissions,
  )
  const [activeId, setActiveId] = useState<string>('role-details')

  // Scrollspy — picks the entry with the highest intersectionRatio that
  // currently intersects the viewport band. The rootMargin band keeps
  // section headers from staying "active" once their body has scrolled
  // far past.
  useEffect(() => {
    const targets = SIDEBAR_ITEMS.map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        setActiveId(visible[0].target.id)
      },
      {
        rootMargin: '-120px 0px -55% 0px',
        threshold: [0, 0.2, 0.5, 1],
      },
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [])

  const togglePermission = (id: string) => {
    if (ALWAYS_ON.has(id)) return
    setPermissions((p) => ({ ...p, [id]: !p[id] }))
  }

  const handleTemplateChange = (value: string) => {
    setTemplate(value)
    if (!value) return
    const granted = new Set([
      ...(TEMPLATE_PERMISSIONS[value] ?? []),
      ...ALWAYS_ON,
    ])
    const next: Record<string, boolean> = {}
    for (const section of PERMISSION_SECTIONS) {
      for (const group of section.groups) {
        for (const p of group.permissions) {
          next[p.id] = granted.has(p.id)
        }
      }
    }
    setPermissions(next)
    const label = TEMPLATE_OPTIONS.find((o) => o.value === value)?.label
    toast.success(`Permissions pre-filled from "${label}".`)
  }

  const grantedCounts = useMemo<Record<string, GrantedCount>>(() => {
    const counts: Record<string, GrantedCount> = {}
    for (const section of PERMISSION_SECTIONS) {
      let granted = 0
      let total = 0
      for (const group of section.groups) {
        for (const p of group.permissions) {
          total += 1
          if (permissions[p.id]) granted += 1
        }
      }
      counts[section.id] = { granted, total }
    }
    return counts
  }, [permissions])

  const handleCreate = async () => {
    if (!roleName.trim()) {
      toast.error('Role name is required.')
      return
    }
    if (!roleDescription.trim()) {
      toast.error('Role description is required.')
      return
    }
    // Send only the granted, configurable permissions. The always-on
    // slugs are implicit and not part of the backend catalog — sending
    // them would trigger an "unknown permission" rejection.
    const selectedPermissions = Object.entries(permissions)
      .filter(([id, on]) => on && !ALWAYS_ON.has(id))
      .map(([id]) => id)

    try {
      await createRole.mutateAsync({
        name: roleName.trim(),
        description: roleDescription.trim(),
        permissions: selectedPermissions,
      })
      toast.success(`Role "${roleName.trim()}" created.`)
      router.push('/settings/roles')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to create role.',
      )
    }
  }

  return {
    roleName,
    setRoleName,
    roleDescription,
    setRoleDescription,
    template,
    handleTemplateChange,
    permissions,
    togglePermission,
    grantedCounts,
    activeId,
    handleCreate,
    isCreating: createRole.isPending,
  }
}
