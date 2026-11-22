import { useEffect, useState } from 'react'
import { Archive, X } from 'lucide-react'

function ArchivedProductsModal({ token, onClose, onSuccess }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [restoringId, setRestoringId] = useState(null)
    const [restoreError, setRestoreError] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        const loadArchivedProducts = async () => {
            try {
                const response = await fetch('/api/products/archived', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error('Failed to load archived products.')
                }

                const data = await response.json()
                setProducts(data)
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

        loadArchivedProducts()

        return () => controller.abort()
    }, [token])



    //handle restoration
    const handleRestore = async (product) => {
        if (restoringId !== null) return

        const confirmed = window.confirm(
            `Restore "${product.productName}" to active inventory?`
        )

        if (!confirmed) return

        setRestoringId(product.productId)
        setRestoreError('')

        try {
            const response = await fetch(
                `/api/products/${product.productId}/restore`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Session expired. Please log in again.')
                }

                if (response.status === 403) {
                    throw new Error('You do not have permission to restore products.')
                }

                throw new Error('Failed to restore product.')
            }

            setProducts((previous) =>
                previous.filter((p) => p.productId !== product.productId)
            )

            onSuccess?.()
        } catch (error) {
            setRestoreError(error.message)
        } finally {
            setRestoringId(null)
        }
    }

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
                aria-labelledby="archived-products-title"
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Archive size={22} className="text-indigo-600" />
                        <h2
                            id="archived-products-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            Archived Products
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close archived products"
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="mb-5 text-sm text-slate-500">
                    Products archived from your active inventory.
                </p>

                {loading && (
                    <p className="text-sm text-slate-500">
                        Loading archived products...
                    </p>
                )}

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                {!loading && !error && products.length === 0 && (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        No archived products found.
                    </p>
                )}

                {restoreError && (
                    <p role="alert" className="mb-3 text-sm text-red-600">
                        {restoreError}
                    </p>
                )}

                {!loading && !error && products.length > 0 && (
                    <div className="space-y-3">
                        {products.map((product) => (
                            <div
                                key={product.productId}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {product.productName}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        SKU: {product.sku}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleRestore(product)}
                                        disabled={restoringId !== null}
                                        className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {restoringId === product.productId
                                            ? 'Restoring...'
                                            : 'Restore'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ArchivedProductsModal