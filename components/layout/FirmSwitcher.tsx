'use client'

import { useRouter } from 'next/navigation'
import { CaretUpDown, Check, Buildings } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/shared/Spinner'
import { useSwitchFirm } from '@/hooks/use-switch-firm'
import { useAuthStore } from '@/stores/auth.store'
import { errorMessage } from '@/lib/errors'

/**
 * Lets a person who belongs to more than one firm move between them. Hidden
 * for everyone with a single active membership.
 */
export function FirmSwitcher() {
  const router = useRouter()
  const memberships = useAuthStore((s) => s.memberships)
  const activeFirmId = useAuthStore((s) => s.activeMembership?.firm_id)
  const switchFirm = useSwitchFirm()

  const firms = (memberships ?? []).filter((m) => m.status === 'active')
  if (firms.length < 2) return null
  const current = firms.find((m) => m.firm_id === activeFirmId)

  const choose = async (firmId: string, firmName: string) => {
    if (firmId === activeFirmId || switchFirm.isPending) return
    const id = toast.loading(`Switching to ${firmName}...`)
    try {
      await switchFirm.mutateAsync(firmId)
      toast.success(`You are now working in ${firmName}.`, { id })
      router.push('/dashboard')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not switch firms. Please try again.'), { id })
    }
  }

  return (
    <div className="px-3 pb-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)' }}
              aria-label="Switch firm"
            >
              {switchFirm.isPending ? (
                <Spinner size={14} />
              ) : (
                <Buildings size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Firm
                </span>
                <span className="block truncate text-[12.5px] font-semibold">{current?.firm_name ?? 'Choose a firm'}</span>
              </span>
              <CaretUpDown size={13} style={{ color: 'rgba(255,255,255,0.5)' }} />
            </button>
          }
        />
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel className="text-[11px]">Your firms</DropdownMenuLabel>
          {firms.map((m) => (
            <DropdownMenuItem
              key={m.firm_id}
              onClick={() => void choose(m.firm_id, m.firm_name)}
              className="cursor-pointer text-[13px]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{m.firm_name}</span>
                <span className="block text-[11px] capitalize text-muted-foreground">{m.firm_role}</span>
              </span>
              {m.firm_id === activeFirmId && <Check size={14} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
