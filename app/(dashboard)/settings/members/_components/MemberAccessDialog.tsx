'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/Spinner'
import {
  PROFESSIONAL_TITLES,
  useChangeProfessionalTitle,
  type FirmMember,
} from '@/hooks/use-firm-members'
import { useFirmRoles, useSetMemberRoles } from '@/hooks/use-firm-roles'
import { errorMessage } from '@/lib/errors'
import { RolePicker } from './RolePicker'

/**
 * Change a member's roles and professional title. Their permissions are the
 * union of the roles held; the change applies to their next action, without
 * them signing in again.
 */
export function MemberAccessDialog({ member, onClose }: { member: FirmMember | null; onClose: () => void }) {
  return (
    <Dialog open={!!member} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]" style={{ background: 'var(--cream-white)' }}>
        {member && <AccessForm key={member.id} member={member} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function AccessForm({ member, onClose }: { member: FirmMember; onClose: () => void }) {
  const { data: roles, isLoading } = useFirmRoles()
  const setRoles = useSetMemberRoles()
  const changeTitle = useChangeProfessionalTitle()
  const [roleIds, setRoleIds] = useState<string[]>(() => (member.roles ?? []).map((r) => r.id))
  const [title, setTitle] = useState(member.professional_title)
  const [touched, setTouched] = useState(false)
  const saving = setRoles.isPending || changeTitle.isPending

  const save = async () => {
    setTouched(true)
    if (roleIds.length === 0) return
    const id = toast.loading(`Updating ${member.name}'s access...`)
    try {
      const current = new Set((member.roles ?? []).map((r) => r.id))
      const rolesChanged = roleIds.length !== current.size || roleIds.some((r) => !current.has(r))
      if (rolesChanged) await setRoles.mutateAsync(member.id, roleIds)
      if (title !== member.professional_title) {
        await changeTitle.mutateAsync({ member_id: member.id, professional_title: title })
      }
      toast.success(`${member.name}'s access was updated.`, { id })
      onClose()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this member. Please try again.'), { id })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle style={{ color: 'var(--navy)' }}>Roles and title for {member.name}</DialogTitle>
        <DialogDescription>
          Their permissions are everything the chosen roles allow. Changes apply straight away.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-1">
        <div>
          <Label className="mb-1.5 block text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
            Professional title
          </Label>
          <Select value={title} onValueChange={(v) => setTitle((v as string) || member.professional_title)}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROFESSIONAL_TITLES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <RolePicker roles={roles ?? []} loading={isLoading} value={roleIds} onChange={setRoleIds} />
          {touched && roleIds.length === 0 && (
            <p className="mt-1 text-xs text-red-500">Choose at least one role.</p>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving && <Spinner size={14} />}
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>
    </>
  )
}
