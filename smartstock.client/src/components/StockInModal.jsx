import { useState } from 'react'
import { X, PackagePlus } from 'lucide-react'

function StockInModal({ product, token, onClose, onSuccess }) {
    const [quantity, setQuantity] = useState('')
    const [supplierId, setSupplierId] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')


    //sends selected product ID, incoming quantity & opitonal supplier ID to backend
    const handleSubmit = async (e) => {
        e.preventDefault()

        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/stock-movements/stock-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productId: product.productId,
                    quantity: Number(quantity),
                    supplierId: supplierId.trim()
                        ? Number(supplierId)
                        : null,
                }),
            })

            if (!response.ok) {
                const message = await response.text()

                if (response.status === 401) {
                    setError('Session expired. Please log in again.')
                } else if (response.status === 403) {
                    setError('You do not have permission to perform Stock In.')
                } else {
                    setError(message || `Stock In failed (${response.status}).`)
                }

                return
            }

            alert('Stock added successfully!')
            onSuccess()
            onClose()
        } catch (err) {
            console.error('Stock In failed:', err)
            setError('Unable to connect to the server.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="stock-in-title"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PackagePlus className="text-indigo-600" size={22} />
                        <h2 id="stock-in-title" className="text-xl font-bold text-slate-900">
                            Stock In
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close Stock In"
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
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
                        Current Stock: {product.stockOnHand} units
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="stock-in-quantity"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Incoming Quantity
                        </label>

                        <input
                            id="stock-in-quantity"
                            type="number"
                            min="0.001"
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
                            htmlFor="stock-in-supplier"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Supplier ID (Optional)
                        </label>

                        <input
                            id="stock-in-supplier"
                            type="number"
                            min="1"
                            step="1"
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            placeholder="Enter supplier ID"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                        />
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
                            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-full bg-[#1F3046] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2B405B] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'Adding Stock...' : 'Confirm Stock In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default StockInModal