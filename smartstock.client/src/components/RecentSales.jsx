import { ArrowUpRight, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router'
import { formatSaleDateTime } from '../utils/dashboardActivity'
import { formatCurrency } from '../utils/dashboardRevenue'

function RecentSales({ sales, loading, error }) {
    return (
        <section className="rounded-[20px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">
                        Recent Sales
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Latest five transactions.
                    </p>
                </div>

                <Link
                    to="/sales"
                    className="flex min-h-8 shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 sm:min-h-0"
                >
                    View All Sales
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
                    Loading recent sales...
                </div>
            ) : sales.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No sales recorded yet.
                </div>
            ) : (
                <ul className="mt-5 divide-y divide-slate-100">
                    {sales.map((sale, index) => (
                        <li
                            key={sale.saleId ?? index}
                            className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                                <ShoppingBag size={17} />
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[#20334F]">
                                    Sale #{sale.saleId}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {formatSaleDateTime(sale.soldAt)}
                                </p>
                            </div>

                            <span className="shrink-0 text-sm font-bold text-teal-600">
                                {formatCurrency(sale.totalAmount)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default RecentSales
