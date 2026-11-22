import { ReceiptText } from 'lucide-react'
import { formatMoney } from '../utils/formatMoney'

const formatDateTime = (value) => {
    if (!value) return { date: '—', time: '—' }

    const date = new Date(value)

    return {
        date: new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Kuala_Lumpur',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date),
        time: new Intl.DateTimeFormat('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(date),
    }
}

function SaleDetailsPanel({ sale, loading, error }) {
    if (!sale && !loading && !error) {
        return (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl bg-white/70 p-8 text-center shadow-sm">
                <ReceiptText size={36} className="text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-500">
                    Select a sale to view its details.
                </p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-white/70 p-8 shadow-sm">
                <p className="text-sm text-slate-500">Loading sale details...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-white/70 p-8 shadow-sm">
                <p role="alert" className="text-sm text-red-600">
                    {error}
                </p>
            </div>
        )
    }

    if (!sale) return null

    const { date, time } = formatDateTime(sale.soldAt)
    const items = sale.items || []
    const subtotal = items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
        0
    )

    return (
        <div className="overflow-hidden rounded-3xl bg-white/70 shadow-sm">
            <div className="p-5">
                <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                        SALE DETAILS
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                        Sale #{sale.saleId}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        {date} · {time}
                    </p>
                </div>

                <div className="mt-4 rounded-2xl bg-teal-600 p-4 text-white shadow-md">
                    <p className="text-[10px] font-bold tracking-[0.16em] text-teal-100">
                        GRAND TOTAL
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                        RM {formatMoney(sale.totalAmount)}
                    </p>
                </div>

                <div className="mt-5">
                    <h3 className="mb-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
                        ITEMIZED BREAKDOWN
                    </h3>

                    {items.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                            No line items recorded for this sale.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div
                                    key={item.saleItemId}
                                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                {item.productName}
                                            </p>

                                            {item.sku && (
                                                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                                    SKU {item.sku}
                                                </p>
                                            )}

                                            <p className="mt-1 text-xs text-slate-500">
                                                Qty {item.quantity} · RM{' '}
                                                {formatMoney(item.unitPrice)} each
                                            </p>
                                        </div>

                                        <p className="shrink-0 text-sm font-bold text-slate-800">
                                            RM {formatMoney(item.subtotal)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>RM {formatMoney(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-slate-900">
                        <span>Grand Total</span>
                        <span>RM {formatMoney(sale.totalAmount)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SaleDetailsPanel
