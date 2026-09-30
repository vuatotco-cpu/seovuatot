import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import { WebsiteProvider } from '@/contexts/WebsiteContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WebsiteProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </WebsiteProvider>
  )
}
