import { NavLink } from 'react-router'
import {
   LayoutDashboard,
   Package,
   Warehouse,
   ShoppingCart,
   LogOut,
   Boxes,
   X,
} from 'lucide-react'

const MENU_ITEMS = [
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

function Sidebar({
   onLogout,
   mobile = false,
   open = false,
   onClose,
   onNavigate,
   drawerRef,
   closeButtonRef,
}) {
   const focusClasses =
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500'
   const panelClasses = mobile
      ? `fixed inset-y-0 left-0 z-50 flex w-64 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto border-r border-white/60 bg-white/80 p-5 text-slate-800 shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out motion-reduce:transition-none lg:hidden ${open ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`
      : 'hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-white/60 bg-white/80 p-5 text-slate-800 backdrop-blur-xl lg:flex'

   return (
      <aside
         ref={drawerRef}
         id={mobile ? 'mobile-sidebar' : undefined}
         role={mobile ? 'dialog' : undefined}
         aria-modal={mobile ? 'true' : undefined}
         aria-label={mobile ? 'Navigation menu' : undefined}
         aria-hidden={mobile ? !open : undefined}
         inert={mobile ? !open : undefined}
         className={panelClasses}
      >
         {mobile && (
            <button
               ref={closeButtonRef}
               type="button"
               onClick={onClose}
               aria-label="Close navigation menu"
               className={`absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 ${focusClasses} motion-reduce:transition-none`}
            >
               <X size={18} />
            </button>
         )}

         {/* Branding */}
         <div className="mb-12 flex items-center gap-3 px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-md">
               <Boxes size={22} />
            </div>

            <div>
               <h2 className="text-lg font-bold tracking-tight">SmartStock</h2>
               <p className="text-xs text-slate-500">Inventory &amp; Sales</p>
            </div>
         </div>

         {/* Navigation */}
         <nav className="flex flex-col gap-2">
            {MENU_ITEMS.map((item) => {
               const Icon = item.icon

               return (
                  <NavLink
                     key={item.path}
                     to={item.path}
                     onClick={onNavigate}
                     className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 motion-reduce:transition-none ${focusClasses} ${
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
               className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 motion-reduce:transition-none ${focusClasses}`}
            >
               <LogOut size={19} strokeWidth={1.8} />
               <span>Logout</span>
            </button>
         </div>
      </aside>
   )
}

export default Sidebar
