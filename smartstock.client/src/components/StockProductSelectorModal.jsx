import { useEffect, useRef, useState } from 'react'
import { Boxes, Search, X } from 'lucide-react'

function StockProductSelectorModal({ products, onSelect, onClose }) {
    const [search, setSearch] = useState('')
    const searchInputRef = useRef(null)

    useEffect(() => {
        searchInputRef.current?.focus()
    }, [])

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    const filteredProducts = products.filter((product) => {
        const keyword = search.toLowerCase().trim()

        return (
            product.productName.toLowerCase().includes(keyword) ||
            product.sku.toLowerCase().includes(keyword)
        )
    })

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
                aria-labelledby="stock-product-selector-title"
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Boxes className="text-indigo-600" size={22} />
                        <h2
                            id="stock-product-selector-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            Select Product
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close product selector"
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="mb-5 text-sm text-slate-500">
                    Choose a product for the stock operation.
                </p>

                <div className="mb-4">
                    <label
                        htmlFor="stock-product-search"
                        className="mb-1 block text-sm font-medium text-slate-700"
                    >
                        Search Products
                    </label>

                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            id="stock-product-search"
                            ref={searchInputRef}
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search product name or SKU..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-400"
                        />
                    </div>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-6 text-center">
                        <p className="text-sm font-semibold text-slate-700">
                            {products.length === 0
                                ? 'No active products available'
                                : 'No products found'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            {products.length === 0
                                ? 'Add or restore a product before recording a stock movement.'
                                : 'Try searching with a different product name or SKU.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.productId}
                                type="button"
                                onClick={() => onSelect(product)}
                                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {product.productName}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        SKU: {product.sku}
                                    </p>
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className="text-xs text-slate-500">
                                        Current stock
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {Number(product.stockOnHand ?? 0).toLocaleString('en-MY')} units
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-5 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-300 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StockProductSelectorModal
