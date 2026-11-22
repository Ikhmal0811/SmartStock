import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import Sidebar from './Sidebar'
import TopNavigation from './TopNavigation'

function MainLayout({ onLogout }) {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
   const menuButtonRef = useRef(null)
   const closeButtonRef = useRef(null)
   const drawerRef = useRef(null)
   const wasOpenRef = useRef(false)
   const navigate = useNavigate()

   const closeMenu = () => setMobileMenuOpen(false)

   const handleLogout = () => {
      closeMenu()
      onLogout()
      navigate('/login', { replace: true })
   }

   useEffect(() => {
      const desktop = window.matchMedia('(min-width: 1024px)')
      const handleChange = (event) => {
         if (event.matches) setMobileMenuOpen(false)
      }

      desktop.addEventListener('change', handleChange)
      return () => desktop.removeEventListener('change', handleChange)
   }, [])

   useEffect(() => {
      if (!mobileMenuOpen) return undefined

      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const handleKeyDown = (event) => {
         if (event.key === 'Escape') {
            event.preventDefault()
            setMobileMenuOpen(false)
            return
         }

         if (event.key !== 'Tab') return

         const focusable = Array.from(
            drawerRef.current?.querySelectorAll(
               'a[href], button:not([disabled])'
            ) || []
         ).filter((element) => element.getClientRects().length > 0)

         if (focusable.length === 0) return

         const first = focusable[0]
         const last = focusable[focusable.length - 1]

         if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
         } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
         }
      }

      document.addEventListener('keydown', handleKeyDown)

      return () => {
         document.removeEventListener('keydown', handleKeyDown)
         document.body.style.overflow = previousOverflow
      }
   }, [mobileMenuOpen])

   useEffect(() => {
      if (mobileMenuOpen) {
         wasOpenRef.current = true
         closeButtonRef.current?.focus()
      } else if (wasOpenRef.current) {
         wasOpenRef.current = false
         menuButtonRef.current?.focus()
      }
   }, [mobileMenuOpen])

   return (
      <div className="h-dvh overflow-hidden bg-slate-100 p-3 lg:p-4">
         <div className="flex h-full overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-blue-100 via-indigo-50 to-slate-200 shadow-xl">
            <Sidebar onLogout={handleLogout} />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
               <TopNavigation
                  onOpenMenu={() => setMobileMenuOpen(true)}
                  menuOpen={mobileMenuOpen}
                  buttonRef={menuButtonRef}
               />

               <main
                  className={`min-h-0 min-w-0 flex-1 overflow-y-auto p-4 lg:p-6 ${
                     mobileMenuOpen ? 'overflow-y-hidden' : ''
                  }`}
                  aria-hidden={mobileMenuOpen ? 'true' : undefined}
                  inert={mobileMenuOpen ? true : undefined}
               >
                  <Outlet />
               </main>
            </div>

            <div
               aria-hidden="true"
               onClick={closeMenu}
               className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none lg:hidden ${
                  mobileMenuOpen
                     ? 'opacity-100'
                     : 'pointer-events-none opacity-0'
               }`}
            />

            <Sidebar
               mobile
               open={mobileMenuOpen}
               onClose={closeMenu}
               onNavigate={closeMenu}
               onLogout={handleLogout}
               drawerRef={drawerRef}
               closeButtonRef={closeButtonRef}
            />
         </div>
      </div>
   )
}

export default MainLayout
