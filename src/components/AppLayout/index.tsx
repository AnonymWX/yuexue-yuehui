import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF8F0] dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pl-20">
        <Outlet />
      </main>
    </div>
  )
}
