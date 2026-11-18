import { X, Package } from 'lucide-react'

function ProductDetails({ product, onClose }) {
    const formatCurrency = (value) =>
        Number(value).toLocaleString('en-MY', {
            style: 'currency',
            currency: 'MYR',
        })

    const fields = [
        ['Product Name', product.productName],
        ['SKU', product.sku],
        ['Category ID', product.categoryId],
        ['Supplier ID', product.supplierId ?? 'Not assigned'],
        ['Selling Price', formatCurrency(product.sellingPrice)],
        ['Cost Price', formatCurrency(product.costPrice)],
        ['Stock Quantity', `${product.stockOnHand} units`],
        ['Reorder Level', `${product.reorderLevel} units`],
    ]

    const status =
        product.stockOnHand === 0
            ? 'Out of Stock'
            : product.stockOnHand <= product.reorderLevel
                ? 'Low Stock'
                : 'In Stock'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-details-title"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2
                        id="product-details-title"
                        className="text-xl font-bold text-slate-900"
                    >
                        Product Details
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close product details"
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-indigo-50 p-4">
                    <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                        <Package size={24} />
                    </div>

                    <div>
                        <p className="font-semibold text-slate-900">
                            {product.productName}
                        </p>
                        <p className="text-sm text-slate-500">
                            SKU: {product.sku}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {fields.map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-xl bg-slate-50 p-3"
                        >
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 rounded-xl bg-indigo-50 p-4">
                    <p className="text-xs text-slate-500">Stock Status</p>
                    <p className="mt-1 font-semibold text-slate-800">
                        {status}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 w-full rounded-full bg-[#1F3046] px-5 py-3 font-semibold text-white hover:bg-[#2B405B]"
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export default ProductDetails