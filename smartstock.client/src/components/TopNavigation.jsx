import { Boxes, Menu } from 'lucide-react'

function TopNavigation({ onOpenMenu, menuOpen, buttonRef }) {
   return (
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/60 bg-white/70 px-4 py-3 backdrop-blur-xl lg:hidden">
         <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-sm">
               <Boxes size={18} />
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-800">
               SmartStock
            </span>
         </div>

         <button
            ref={buttonRef}
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 motion-reduce:transition-none"
         >
            <Menu size={20} strokeWidth={1.8} />
         </button>
      </header>
   )
}

export default TopNavigation
