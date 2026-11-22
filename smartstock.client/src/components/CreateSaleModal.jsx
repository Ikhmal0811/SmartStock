import { useEffect, useMemo, useState } from 'react'
import { X, ShoppingCart, Plus, Minus, Trash2, Search } from 'lucide-react'
import { formatMoney } from '../utils/formatMoney'

function CreateSaleModal({ token, onClose, onSuccess }) {
    const [products, setProducts] = useState([])
    const [productSearch, setProductSearch] = useState('')
    const [cart, setCart] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        const loadProducts = async () => {
            try {
                const response = await fetch('/api/products', {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                })

                if (response.status === 401) {
                    throw new Error('Session expired. Please log in again.')
                }

                if (response.status === 403) {
                    throw new Error('You do not have permission to view products.')
                }

                if (!response.ok) {
                    throw new Error('Unable to load products.')
                }

                const data = await response.json()
                setProducts(
                    Array.isArray(data) ? data.filter((p) => !p.isArchived) : []
                )
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Unable to load products.')
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingProducts(false)
                }
            }
        }

        loadProducts()
        return () => controller.abort()
    }, [token])

    const filteredProducts = useMemo(() => {
        const term = productSearch.trim().toLowerCase()

        if (!term) return products

        return products.filter(
            (p) =>
                p.productName?.toLowerCase().includes(term) ||
                p.sku?.toLowerCase().includes(term)
        )
    }, [products, productSearch])

    const total = cart.reduce(
        (sum, item) => sum + Number(item.sellingPrice) * item.quantity,
        0
    )

    const handleAddToCart = (product) => {
        setError('')

        const available = Number(product.stockOnHand || 0)

        if (available <= 0) {
            setError(`${product.productName} is out of stock.`)
            return
        }

        setCart((current) => {
            const existing = current.find(
                (item) => item.productId === product.productId
            )

            if (existing) {
                if (existing.quantity >= available) {
                    setError(
                        `Only ${available} unit(s) of ${product.productName} available.`
                    )
                    return current
                }

                return current.map((item) =>
                    item.productId === product.productId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }

            return [
                ...current,
                {
                    productId: product.productId,
                    productName: product.productName,
                    sku: product.sku,
                    sellingPrice: product.sellingPrice,
                    stockOnHand: available,
                    quantity: 1,
                },
            ]
        })
    }

    const handleQuantityChange = (productId, delta) => {
        setError('')

        setCart((current) =>
            current
                .map((item) => {
                    if (item.productId !== productId) return item

                    const next = item.quantity + delta

                    if (next <= 0) return null
                    if (next > item.stockOnHand) {
                        setError(
                            `Only ${item.stockOnHand} unit(s) of ${item.productName} available.`
                        )
                        return item
                    }

                    return { ...item, quantity: next }
                })
                .filter(Boolean)
        )
    }

    const handleRemoveFromCart = (productId) => {
        setError('')
        setCart((current) =>
            current.filter((item) => item.productId !== productId)
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (loading) return

        setError('')

        if (cart.length === 0) {
            setError('Add at least one product to the sale.')
            return
        }

        if (
            cart.some(
                (item) =>
                    !Number.isFinite(item.quantity) ||
                    item.quantity <= 0 ||
                    item.quantity > item.stockOnHand
            )
        ) {
            setError('Check cart quantities and available stock.')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items: cart.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                }),
            })

            if (!response.ok) {
                const message = await response.text()

                if (response.status === 401) {
                    setError('Session expired. Please log in again.')
                } else if (response.status === 403) {
                    setError('You do not have permission to create sales.')
                } else if (response.status === 409) {
                    setError(message || 'Insufficient stock. Review the cart and retry.')
                } else {
                    setError(message || `Sale failed (${response.status}).`)
                }

                return
            }

            const result = await response.json()
            alert('Sale completed successfully!')
            onSuccess(result)
        } catch (err) {
            console.error('Sale creation failed:', err)
            setError('Unable to connect to the server.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) onClose()
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-sale-title"
                className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="text-indigo-600" size={22} />
                        <h2
                            id="create-sale-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            New Sale
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close New Sale"
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                                <Search size={16} className="text-slate-400" />
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) =>
                                        setProductSearch(e.target.value)
                                    }
                                    placeholder="Search product name or SKU"
                                    aria-label="Search products"
                                    className="w-full bg-transparent py-3 text-sm outline-none"
                                />
                            </div>

                            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                                {loadingProducts ? (
                                    <p className="p-4 text-sm text-slate-500">
                                        Loading products...
                                    </p>
                                ) : filteredProducts.length === 0 ? (
                                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                        {products.length === 0
                                            ? 'No active products available.'
                                            : 'No products match your search.'}
                                    </p>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const available = Number(
                                            product.stockOnHand || 0
                                        )

                                        return (
                                            <button
                                                key={product.productId}
                                                type="button"
                                                onClick={() =>
                                                    handleAddToCart(product)
                                                }
                                                disabled={loading || available <= 0}
                                                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                        {product.productName}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {product.sku} ·{' '}
                                                        {available} units available
                                                    </p>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        RM{' '}
                                                        {formatMoney(
                                                            product.sellingPrice
                                                        )}
                                                    </p>
                                                    {available <= 0 && (
                                                        <p className="mt-1 text-xs text-red-500">
                                                            Unavailable
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-slate-700">
                                Current Sale ({cart.length})
                            </h3>

                            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                                {cart.length === 0 ? (
                                    <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                                        Select products to build the sale.
                                    </p>
                                ) : (
                                    cart.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                        {item.productName}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        RM{' '}
                                                        {formatMoney(
                                                            item.sellingPrice
                                                        )}{' '}
                                                        each
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveFromCart(
                                                            item.productId
                                                        )
                                                    }
                                                    disabled={loading}
                                                    aria-label={`Remove ${item.productName}`}
                                                    className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuantityChange(
                                                                item.productId,
                                                                -1
                                                            )
                                                        }
                                                        disabled={loading}
                                                        aria-label={`Decrease ${item.productName} quantity`}
                                                        className="rounded-full border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                                    >
                                                        <Minus size={14} />
                                                    </button>

                                                    <span className="w-8 text-center text-sm font-semibold text-slate-800">
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuantityChange(
                                                                item.productId,
                                                                1
                                                            )
                                                        }
                                                        disabled={loading}
                                                        aria-label={`Increase ${item.productName} quantity`}
                                                        className="rounded-full border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <p className="text-sm font-semibold text-slate-800">
                                                    RM{' '}
                                                    {formatMoney(
                                                        item.sellingPrice *
                                                            item.quantity
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-4 rounded-2xl bg-teal-600 p-4 text-white">
                                <p className="text-xs font-semibold text-teal-100">
                                    GRAND TOTAL
                                </p>
                                <p className="mt-1 text-2xl font-bold">
                                    RM {formatMoney(total)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="mt-4 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <div className="mt-5 flex justify-end gap-3">
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
                            disabled={loading || cart.length === 0}
                            className="rounded-full bg-[#20334F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#304967] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'Processing Sale...' : 'Confirm Sale'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateSaleModal
