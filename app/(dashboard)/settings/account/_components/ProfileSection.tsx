'use client'

import {
  Building,
  CreditCard,
  Envelope,
  Phone,
} from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from './primitives/Card'
import { SaveButton } from './primitives/SaveButton'
import { SectionLabel } from './primitives/SectionLabel'
import type { AccountState } from '../_hooks/use-account-state'

export function ProfileSection({ state }: { state: AccountState }) {
  const { profile, setProfile, handleSaveProfile, profilePending } = state
  return (
    <Card
      title="Profile Information"
      subtitle="Update your personal and professional details."
    >
      <div className="space-y-4 max-w-lg">
        <div>
          <SectionLabel>Full Name *</SectionLabel>
          <Input
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            className="h-10"
          />
        </div>

        <div>
          <SectionLabel>
            <div className="flex items-center gap-1.5">
              <Envelope size={12} /> Email
            </div>
          </SectionLabel>
          <Input
            value={profile.email}
            disabled
            className="h-10 bg-gray-50"
          />
          <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
            Email cannot be changed.
          </p>
        </div>

        <div>
          <SectionLabel>
            <div className="flex items-center gap-1.5">
              <Phone size={12} /> Phone
            </div>
          </SectionLabel>
          <Input
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+233 XX XXX XXXX"
            className="h-10"
          />
        </div>

        <div>
          <SectionLabel>
            <div className="flex items-center gap-1.5">
              <Building size={12} /> Law Firm
            </div>
          </SectionLabel>
          <Input
            value={profile.firm}
            onChange={(e) => setProfile((p) => ({ ...p, firm: e.target.value }))}
            placeholder="e.g. Mensah & Associates"
            className="h-10"
          />
        </div>

        <div>
          <SectionLabel>
            <div className="flex items-center gap-1.5">
              <CreditCard size={12} /> Role
            </div>
          </SectionLabel>
          <Input
            value={profile.role}
            disabled
            className="h-10 bg-gray-50"
          />
          <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
            Role is managed by your organization admin.
          </p>
        </div>

        <div>
          <SectionLabel>Bio</SectionLabel>
          <Textarea
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            placeholder="A short professional bio..."
            className="min-h-[80px]"
          />
        </div>

        <div className="pt-2">
          <SaveButton onClick={handleSaveProfile} isPending={profilePending} />
        </div>
      </div>
    </Card>
  )
}
