import { Sidebar } from '@/components/layout/Sidebar'
import { NavigationProgress } from '@/components/shared/NavigationProgress'
import { AuthGuard } from '@/components/shared/AuthGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div
        className="h-screen overflow-hidden p-3"
        style={{
          backgroundImage:
            "linear-gradient(rgba(13,27,42,0.18), rgba(13,27,42,0.18)), url('/assets/images/law%20firm.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex h-full overflow-hidden rounded-2xl">
          <NavigationProgress />
          <Sidebar />
          <main
            className="flex-1 flex flex-col overflow-hidden rounded-r-2xl"
            style={{ background: 'var(--surface-page)' }}
          >
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
