import { ArrowUpRight, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router'

const STATUS_META = {
    outOfStock: {
        label: 'Out of Stock',
        badge: 'bg-red-50 text-red-700 ring-red-200',
    },
    lowStock: {
        label: 'Low Stock',
        badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    },
}

function StockAlerts({ products, loading, error }) {
    return (
        <section className="rounded-[20px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">
                        Stock Alerts
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Products needing attention.
                    </p>
                </div>

                <Link
                    to="/stock"
                    className="flex min-h-8 shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 sm:min-h-0"
                >
                    View Stock Management
                    <ArrowUpRight size={14} />
                </Link>
            </div>

            {error ? (
                <div
                    role="alert"
                    className="mt-5 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-red-600"
                >
                    {error}
                </div>
            ) : loading ? (
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Loading stock alerts...
                </div>
            ) : products.length === 0 ? (
                <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-4 py-6 text-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                        <AlertTriangle size={17} />
                    </span>
                    <p className="text-sm font-semibold text-slate-700">
                        All products are sufficiently stocked
                    </p>
                </div>
            ) : (
                <ul className="mt-5 divide-y divide-slate-100">
                    {products.map((product, index) => {
                        const meta = STATUS_META[product.stockStatus]

                        return (
                            <li
                                key={product.productId ?? index}
                                className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-[#20334F]">
                                        {product.productName}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Stock:{' '}
                                        <span className="font-bold text-slate-700">
                                            {product.stockOnHand}
                                        </span>
                                        <span className="mx-1.5 text-slate-300">
                                            ·
                                        </span>
                                        Reorder: {product.reorderLevel}
                                    </p>
                                </div>

                                <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${meta.badge}`}
                                >
                                    {meta.label}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}

export default StockAlerts
