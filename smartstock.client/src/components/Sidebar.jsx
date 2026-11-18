import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  LogOut,
  Boxes,
} from 'lucide-react'

function Sidebar({ onLogout }) {
  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Products',
      path: '/products',
      icon: Package,
    },
    {
      label: 'Stock Management',
      path: '/stock',
      icon: Warehouse,
    },
    {
      label: 'Sales',
      path: '/sales',
      icon: ShoppingCart,
    },
  ]

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-white/60 bg-white/80 p-5 text-slate-800 backdrop-blur-xl">

      {/* Branding */}
      <div className="mb-12 flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-md">
          <Boxes size={22} />
        </div>

        <div>
          <h2 className="text-lg font-bold tracking-tight">
            SmartStock
          </h2>
          <p className="text-xs text-slate-500">
            Inventory & Sales
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-100 to-violet-100 text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:bg-blue-50 hover:text-slate-800'
                }`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar