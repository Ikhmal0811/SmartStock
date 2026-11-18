import { useState } from 'react'

function AddProduct({ onClose, token, onSuccess }) {
    const [form, setForm] = useState({
        productName: '',
        sku: '',
        categoryId: '',
        supplierId: '',
        sellingPrice: '',
        costPrice: '',
        stockOnHand: '',
        reorderLevel: '',
    })

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    const createProduct = async (confirmDuplicate = false) => {
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
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
                    stockOnHand: Number(form.stockOnHand),
                    reorderLevel: Number(form.reorderLevel),
                    confirmDuplicate,
                }),
            })

            if (response.status === 409) {
                const data = await response.json().catch(() => null)

                if (data?.code === 'POSSIBLE_DUPLICATE') {
                    setDuplicateProduct(data.existingProduct)
                    return
                }

                setError('This SKU already exists. Please use another SKU.')
                return
            }

            if (!response.ok) {
                if (response.status === 403) {
                    setError('Only Admin users can add products.')
                } else {
                    setError(`Unable to add product (${response.status}).`)
                }
                return
            }

            setDuplicateProduct(null)
            alert('Product added successfully!')
            onSuccess()
            onClose()
        } catch (err) {
            console.error('Product submission failed:', err)
            setError('Unable to connect to the server.')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setDuplicateProduct(null)
        createProduct(false)
    }

    const [duplicateProduct, setDuplicateProduct] = useState(null)



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-product-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            >
                <div className="mb-6 flex items-center justify-between">
                    <h2
                        id="add-product-title"
                        className="text-xl font-bold text-slate-800"
                    >
                        Add New Product
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="text-2xl text-slate-500 hover:text-red-600"
                    >
                        &times;
                    </button>
                </div>

                {/* form to submit the add Product */}
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >

                    {[
                        ['productName', 'Product Name', 'text'],
                        ['sku', 'SKU', 'text'],
                        ['categoryId', 'Category ID', 'number'],
                        ['supplierId', 'Supplier ID (Optional)', 'number'],
                        ['sellingPrice', 'Selling Price', 'number'],
                        ['costPrice', 'Cost Price', 'number'],
                        ['stockOnHand', 'Initial Stock', 'number'],
                        ['reorderLevel', 'Reorder Level', 'number'],
                    ].map(([name, label, type]) => (
                        <div key={name}>
                            <label
                                htmlFor={name}
                                className="mb-1 block text-sm font-medium text-slate-700"
                            >
                                {label}
                            </label>

                            <input
                                id={name}
                                name={name}
                                type={type}
                                min={type === 'number' ? 0 : undefined}
                                step={
                                    type === 'number'
                                        ? name === 'categoryId' || name === 'supplierId'
                                            ? '1'
                                            : '0.001'
                                        : undefined
                                }
                                value={form[name]}
                                onChange={handleChange}
                                required={name !== 'supplierId'}
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                            />
                        </div>
                    ))}


                    {error && (
                        <p role="alert" className="text-sm text-red-600 md:col-span-2">
                            {error}
                        </p>
                    )}

                    {duplicateProduct && (
                        <div
                            role="alert"
                            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:col-span-2"
                        >
                            <h3 className="font-semibold text-amber-900">
                                Possible Duplicate Product
                            </h3>

                            <p className="mt-2 text-sm text-amber-800">
                                A product with this name already exists:
                            </p>

                            <div className="mt-3 rounded-xl bg-white p-3 text-sm">
                                <p className="font-semibold text-slate-800">
                                    {duplicateProduct.productName}
                                </p>

                                <p className="mt-1 text-slate-600">
                                    SKU: {duplicateProduct.sku}
                                </p>

                                <p className="text-slate-600">
                                    Price: RM {duplicateProduct.sellingPrice}
                                </p>
                            </div>

                            <p className="mt-3 text-sm text-amber-800">
                                Are you sure this is a different product?
                            </p>

                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDuplicateProduct(null)}
                                    disabled={loading}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
                                >
                                    Review Product
                                </button>

                                <button
                                    type="button"
                                    onClick={() => createProduct(true)}
                                    disabled={loading}
                                    className="rounded-full bg-[#1F3046] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {loading ? 'Adding...' : 'Continue Anyway'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 md:col-span-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 px-5 py-3 text-slate-700 hover:bg-slate-100"
                        >
                            Cancel
                        </button>



                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddProduct