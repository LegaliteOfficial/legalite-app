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
        <div className="flex h-full overflow-hidden gap-3">
          <NavigationProgress />
          <Sidebar />
          <main
            className="flex-1 flex flex-col overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(244, 244, 245, 0.86)',
              backdropFilter: 'blur(6px)',
              // Bump the dashboard's pixel-baked design tokens (text-[11px],
              // text-[13px], icons, padding) by 10% in one place. Sidebar
              // isn't affected because it's a sibling, not a child.
              // `zoom` scales text + icons + spacing together so the
              // result stays balanced — `font-size: 110%` would only
              // affect rem-based text, which this codebase doesn't use.
              zoom: 1.1,
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
