import { useEffect, useState } from 'react'
import { History, X } from 'lucide-react'

function StockHistoryModal({ product, token, onClose }) {
    const [movements, setMovements] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalRecords, setTotalRecords] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [movementFilter, setMovementFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')

    const getMovementLabel = (movementType) => {
        if (movementType === 'STOCK_IN') return 'Stock In'
        if (movementType === 'SALE') return 'Sale'
        if (movementType === 'ADJUSTMENT') return 'Adjustment'
        return movementType || 'Movement'
    }

    const hasFilters = movementFilter !== 'all' || dateFilter !== 'all'


    //fetches selected product stock history from backend when modal opens
    useEffect(() => {
        const controller = new AbortController()


        const loadHistory = async () => {
            setLoading(true)
            setError('')

            try {
                const params = new URLSearchParams({
                    productId: String(product.productId),
                    page: String(currentPage),
                    pageSize: '10',
                })

                if (movementFilter !== 'all') {
                    params.set('movementType', movementFilter)
                }

                if (dateFilter !== 'all') {
                    const days = Number(dateFilter)
                    params.set(
                        'fromDate',
                        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
                    )
                }

                const response = await fetch(
                    `/api/stock-movements?${params.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }
                )

                if (response.status === 401) {
                    throw new Error('Session expired. Please log in again.')
                }

                if (response.status === 403) {
                    throw new Error('You do not have permission to view stock history.')
                }

                if (!response.ok) {
                    throw new Error(`Unable to load history (${response.status})`)
                }

                const result = await response.json()
                setMovements(result.data)
                setTotalPages(result.totalPages)
                setTotalRecords(result.totalRecords)
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        loadHistory()

        return () => controller.abort()
    }, [product.productId, token, currentPage, movementFilter, dateFilter])

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="stock-history-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={22} className="text-indigo-600" />
                        <h2
                            id="stock-history-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            Stock History
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close stock history"
                        className="rounded-full p-2 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-5 rounded-2xl bg-indigo-50 p-4">
                    <p className="font-semibold text-slate-900">
                        {product.productName}
                    </p>
                    <p className="text-sm text-slate-500">
                        SKU: {product.sku}
                    </p>
                </div>

                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="movement-type-filter"
                            className="mb-1 block text-xs font-medium text-slate-600"
                        >
                            Movement Type
                        </label>

                        <select
                            id="movement-type-filter"
                            value={movementFilter}
                            onChange={(e) => {
                                setMovementFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        >
                            <option value="all">All movements</option>
                            <option value="STOCK_IN">Stock In</option>
                            <option value="SALE">Sale</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="movement-date-filter"
                            className="mb-1 block text-xs font-medium text-slate-600"
                        >
                            Date Range
                        </label>

                        <select
                            id="movement-date-filter"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        >
                            <option value="all">All dates</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                        </select>
                    </div>
                </div>

                {loading && (
                    <p className="text-sm text-slate-500">
                        Loading stock history...
                    </p>
                )}

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                {!loading && !error && movements.length === 0 && (
                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        {hasFilters
                            ? 'No stock movements match the selected filters.'
                            : 'No stock movements recorded for this product.'}
                    </div>
                )}

                {!loading && !error && movements.length > 0 && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-indigo-50 text-slate-600">
                                <tr>
                                    <th className="p-3">Movement</th>
                                    <th className="p-3">Quantity</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Details</th>
                                </tr>
                            </thead>

                            <tbody>
                                {movements.map((movement) => (
                                    <tr
                                        key={movement.movementId}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="p-3">
                                            {getMovementLabel(movement.movementType)}
                                        </td>

                                        <td
                                            className={`p-3 font-semibold ${movement.quantityChange > 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}
                                        >
                                            {movement.quantityChange > 0 ? '+' : ''}
                                            {movement.quantityChange}
                                        </td>

                                        <td className="p-3 text-slate-600">
                                            {new Date(movement.createdAt).toLocaleString('en-MY')}
                                        </td>

                                        <td className="p-3 text-xs text-slate-500">
                                            {movement.reason && (
                                                <p className="text-slate-700">
                                                    {movement.reason}
                                                </p>
                                            )}

                                            {movement.saleId && (
                                                <p className="mt-1">
                                                    Sale #{movement.saleId}
                                                </p>
                                            )}

                                            {movement.supplierId && (
                                                <p className="mt-1">
                                                    Supplier #{movement.supplierId}
                                                </p>
                                            )}

                                            {movement.reference && (
                                                <p className="mt-1">
                                                    Ref: {movement.reference}
                                                </p>
                                            )}

                                            {!movement.reason &&
                                                !movement.saleId &&
                                                !movement.supplierId &&
                                                !movement.reference && (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {!loading && !error && totalPages > 0 && (
                            <div className="mt-5 flex items-center justify-between gap-3">
                                <p className="text-sm text-slate-500">
                                    Page {currentPage} of {totalPages} · {totalRecords} records
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={loading || currentPage === 1}
                                        onClick={() => setCurrentPage((prev) => prev - 1)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        disabled={loading || currentPage >= totalPages}
                                        onClick={() => setCurrentPage((prev) => prev + 1)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default StockHistoryModal