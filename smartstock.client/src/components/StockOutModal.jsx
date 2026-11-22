import { useEffect, useRef, useState } from 'react'
import { X, PackageMinus } from 'lucide-react'

function StockOutModal({ product, token, onClose, onSuccess }) {
    const [quantity, setQuantity] = useState('')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const quantityInputRef = useRef(null)

    const availableStock = Number(product.stockOnHand ?? 0)

    useEffect(() => {
        quantityInputRef.current?.focus()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        const quantityValue = Number(quantity)
        const trimmedReason = reason.trim()

        setError('')

        if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
            setError('Enter a quantity greater than zero.')
            return
        }

        if (quantityValue > availableStock) {
            setError('Quantity cannot exceed available stock.')
            return
        }

        if (trimmedReason.length < 3 || trimmedReason.length > 200) {
            setError('Reason must be between 3 and 200 characters.')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/stock-movements/stock-out', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productId: product.productId,
                    quantity: quantityValue,
                    reason: trimmedReason,
                }),
            })

            if (!response.ok) {
                const message = await response.text()

                if (response.status === 401) {
                    setError('Session expired. Please log in again.')
                } else if (response.status === 403) {
                    setError('You do not have permission to perform Stock Out.')
                } else if (response.status === 409) {
                    setError(message || 'Insufficient stock available.')
                } else {
                    setError(message || `Stock Out failed (${response.status}).`)
                }

                return
            }

            alert('Stock removed successfully!')
            onSuccess()
        } catch (err) {
            console.error('Stock Out failed:', err)
            setError('Unable to connect to the server.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) {
                    onClose()
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="stock-out-title"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PackageMinus className="text-indigo-600" size={22} />
                        <h2 id="stock-out-title" className="text-xl font-bold text-slate-900">
                            Stock Out
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close Stock Out"
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-5 rounded-2xl bg-indigo-50 p-4">
                    <p className="text-xs text-slate-500">Selected Product</p>
                    <p className="mt-1 font-semibold text-slate-900">
                        {product.productName}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        SKU: {product.sku}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        Available Stock:{' '}
                        <span className="font-semibold">
                            {availableStock.toLocaleString('en-MY')} units
                        </span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="stock-out-quantity"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Outgoing Quantity
                        </label>

                        <input
                            id="stock-out-quantity"
                            ref={quantityInputRef}
                            type="number"
                            min="0.001"
                            max={availableStock}
                            step="0.001"
                            required
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="stock-out-reason"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Reason
                        </label>

                        <textarea
                            id="stock-out-reason"
                            rows="3"
                            minLength="3"
                            maxLength="200"
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Example: Damaged during storage"
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
                        />

                        <p className="mt-1 text-xs text-slate-400">
                            {reason.trim().length}/200 characters
                        </p>
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-full bg-[#1F3046] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2B405B] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'Removing Stock...' : 'Confirm Stock Out'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default StockOutModal
