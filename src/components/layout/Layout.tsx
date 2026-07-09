import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-8 pt-7 pb-16 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
