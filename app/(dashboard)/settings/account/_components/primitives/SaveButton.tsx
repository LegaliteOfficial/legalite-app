'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/shared/Spinner'

export function SaveButton({
  onClick,
  isPending,
  label = 'Save Changes',
  pendingLabel = 'Saving...',
}: {
  onClick: () => void
  isPending: boolean
  label?: string
  pendingLabel?: string
}) {
  return (
    <Button
      onClick={onClick}
      disabled={isPending}
      className="text-white font-medium px-6"
      style={{
        background: 'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)',
      }}
    >
      {isPending ? (
        <>
          <Spinner size={14} className="mr-2" /> {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  )
}
