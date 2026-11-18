import { Outlet, useNavigate } from 'react-router'
import Sidebar from './Sidebar'

function MainLayout({ onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login', { replace: true })
  }

  return (
  <div className="h-dvh overflow-hidden bg-slate-100 p-3 lg:p-4">
    <div className="flex h-full overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-blue-100 via-indigo-50 to-slate-200 shadow-xl">

      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main content */}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
        <Outlet />
      </main>

    </div>
  </div>
)
}

export default MainLayout