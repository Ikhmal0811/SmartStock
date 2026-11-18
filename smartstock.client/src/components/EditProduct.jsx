import { useState } from 'react'
import { X } from 'lucide-react'

function EditProduct({ product, token, onClose, onSuccess }) {



    const [form, setForm] = useState({
        productName: product.productName,
        sku: product.sku,
        categoryId: product.categoryId,
        supplierId: product.supplierId ?? '',
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        reorderLevel: product.reorderLevel,
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch(`/api/products/${product.productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productName: form.productName.trim(),
                    sku: form.sku.trim(),
                    categoryId: Number(form.categoryId),
                    supplierId: form.supplierId
                        ? Number(form.supplierId)
                        : null,
                    sellingPrice: Number(form.sellingPrice),
                    costPrice: Number(form.costPrice),
                    reorderLevel: Number(form.reorderLevel),
                }),
            })

            if (!response.ok) {
                const message = await response.text()

                if (response.status === 403) {
                    setError('Only Admin users can edit products.')
                } else if (response.status === 401) {
                    setError('Your session has expired. Please log in again.')
                } else if (response.status === 409) {
                    setError('This SKU is already used by another product.')
                } else {
                    setError(message || `Unable to update product (${response.status}).`)
                }

                return
            }

            onSuccess()
            onClose()
        } catch (err) {
            console.error('Product update failed:', err)
            setError('Unable to connect to the server.')
        } finally {
            setLoading(false)
        }
    }

    const fields = [
        ['productName', 'Product Name', 'text'],
        ['sku', 'SKU', 'text'],
        ['categoryId', 'Category ID', 'number'],
        ['supplierId', 'Supplier ID (Optional)', 'number'],
        ['sellingPrice', 'Selling Price', 'number'],
        ['costPrice', 'Cost Price', 'number'],
        ['reorderLevel', 'Reorder Level', 'number'],
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={(e) => {
            if (e.target === e.currentTarget) {
                onClose()
            }
        }}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-product-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2
                        id="edit-product-title"
                        className="text-xl font-bold text-slate-900"
                    >
                        Edit Product
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close Edit Product"
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >

                    {fields.map(([name, label, type]) => (
                        <div key={name}>
                            <label
                                htmlFor={`edit-${name}`}
                                className="mb-1 block text-sm font-medium text-slate-700"
                            >
                                {label}
                            </label>

                            <input
                                id={`edit-${name}`}
                                name={name}
                                type={type}
                                min={type === 'number' ? 0 : undefined}
                                step={
                                    name === 'categoryId' || name === 'supplierId'
                                        ? '1'
                                        : type === 'number'
                                            ? '0.01'
                                            : undefined
                                }
                                value={form[name]}
                                onChange={handleChange}
                                required={name !== 'supplierId'}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                            />
                        </div>
                    ))}

                    {error && (
                        <p role="alert" className="text-sm text-red-600 sm:col-span-2">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 sm:col-span-2">
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
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditProduct