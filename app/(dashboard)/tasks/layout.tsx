import { RequirePermission } from '@/components/shared/RequirePermission'

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePermission anyOf={['view-assigned-tasks', 'view-all-tasks']} what="tasks">
      {children}
    </RequirePermission>
  )
}
