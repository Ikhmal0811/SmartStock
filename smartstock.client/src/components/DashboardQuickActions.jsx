import { useNavigate } from 'react-router'
import { Boxes, Package, ShoppingCart } from 'lucide-react'
import { canCreateSale } from '../utils/dashboardPermissions'

function DashboardQuickActions({ token }) {
    const navigate = useNavigate()
    const isAllowed = canCreateSale(token)

    const actions = [
        {
            id: 'new-sale',
            label: 'New Sale',
            icon: ShoppingCart,
            className:
                'bg-[#20334F] text-white shadow-sm shadow-slate-900/20 hover:bg-[#304967]',
            onClick: () => navigate('/sales', { state: { openNewSale: true } }),
            visible: isAllowed,
        },
        {
            id: 'stock-management',
            label: 'Stock Management',
            icon: Package,
            className:
                'border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700',
            onClick: () => navigate('/stock'),
            visible: isAllowed,
        },
        {
            id: 'view-products',
            label: 'View Products',
            icon: Boxes,
            className:
                'border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700',
            onClick: () => navigate('/products'),
            visible: isAllowed,
        },
    ].filter((action) => action.visible)

    if (actions.length === 0) return null

    return (
        <section className="rounded-[20px] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-500">
                Jump into the most common tasks.
            </p>

            <div className="mt-5 grid gap-3 @md:grid-cols-3">
                {actions.map((action) => {
                    const Icon = action.icon

                    return (
                        <button
                            key={action.id}
                            type="button"
                            onClick={action.onClick}
                            className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${action.className}`}
                        >
                            <Icon size={17} />
                            {action.label}
                        </button>
                    )
                })}
            </div>
        </section>
    )
}

export default DashboardQuickActions
