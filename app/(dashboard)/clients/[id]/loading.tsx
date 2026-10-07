import { ProfileHeaderSkeleton, SectionSkeleton } from './_components/skeletons'

export default function Loading() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-6 px-6 py-5">
        <ProfileHeaderSkeleton />
        <SectionSkeleton rows={3} label="Loading client" />
      </div>
    </div>
  )
}
