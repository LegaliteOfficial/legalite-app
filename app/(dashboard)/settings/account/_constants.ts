import { Bell, Lock, Palette, Plug, User } from '@phosphor-icons/react'
import type { ElementType } from 'react'
import type { SectionId } from './_types'

export const VALID_SECTIONS: readonly SectionId[] = [
  'profile',
  'notifications',
  'security',
  'appearance',
  'integrations',
]

export const SECTIONS_NAV: { id: SectionId; label: string; icon: ElementType }[] =
  [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Plug },
  ]
