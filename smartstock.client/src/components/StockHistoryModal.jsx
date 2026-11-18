import { useEffect, useState } from 'react'
import { History, X } from 'lucide-react'

function StockHistoryModal({ product, token, onClose }) {
    const [movements, setMovements] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalRecords, setTotalRecords] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')


    //fetches selected product stock history from backend when modal opens
    useEffect(() => {
        const controller = new AbortController()


        const loadHistory = async () => {
            setLoading(true)
            setError('')

            try {
                const response = await fetch(
                    `/api/stock-movements?productId=${product.productId}&page=${currentPage}&pageSize=10`,
                {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }
                )

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
    }, [product.productId, token, currentPage])

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
                    <p className="text-sm text-slate-500">
                        No stock movements recorded for this product.
                    </p>
                )}

                {!loading && !error && movements.length > 0 && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-indigo-50 text-slate-600">
                                <tr>
                                    <th className="p-3">Movement</th>
                                    <th className="p-3">Quantity</th>
                                    <th className="p-3">Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {movements.map((movement) => (
                                    <tr
                                        key={movement.movementId}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="p-3">
                                            {movement.movementType === 'STOCK_IN'
                                                ? 'Stock In'
                                                : movement.movementType === 'SALE'
                                                    ? 'Sale'
                                                    : 'Adjustment'}
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
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((prev) => prev - 1)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        disabled={currentPage >= totalPages}
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