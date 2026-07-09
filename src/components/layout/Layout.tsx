import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function Layout() {
  const [sidebarAberta, setSidebarAberta] = useState(false)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar aberta={sidebarAberta} fechar={() => setSidebarAberta(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onAbrirMenu={() => setSidebarAberta(true)} />
        <main className="flex-1 px-4 md:px-8 pt-7 pb-16 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
