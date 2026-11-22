import { useEffect, useState, useRef } from 'react'
import AddProduct from '../components/AddProduct'
import { Search, ListFilter, Archive, MoreVertical } from 'lucide-react'
import ProductDetails from '../components/ProductDetails'
import EditProduct from '../components/EditProduct'
import StockInModal from '../components/StockInModal'
import StockHistoryModal from '../components/StockHistoryModal'
import ArchivedProductsModal from '../components/ArchivedProductsModal'
import { getDashboardRole } from '../utils/dashboardPermissions'

function Products({ token }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [stockFilter, setStockFilter] = useState('all')
    const [showAddForm, setShowAddForm] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(5)
    const [openMenuId, setOpenMenuId] = useState(null)
    const menuRef = useRef(null)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [editingProduct, setEditingProduct] = useState(null)
    const [stockInProduct, setStockInProduct] = useState(null)
    const [stockHistoryProduct, setStockHistoryProduct] = useState(null)
    const [archiveProduct, setArchiveProduct] = useState(null)
    const [archiving, setArchiving] = useState(false)
    const [archiveError, setArchiveError] = useState('')
    const [showArchivedProducts, setShowArchivedProducts] = useState(false)


    useEffect(() => {
        const controller = new AbortController()

        const loadProducts = async () => {
            setLoading(true)
            setError('')

            try {
                const response = await fetch('/api/products', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error(`Unable to load products (${response.status})`)
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

        loadProducts()

        return () => controller.abort()
    }, [token, refreshKey])


    //filter products
    const filteredProducts = products.filter((product) => {
        const keyword = search.toLowerCase().trim()

        const matchesSearch =
            product.productName.toLowerCase().includes(keyword) ||
            product.sku.toLowerCase().includes(keyword)

        const matchesStock =
            stockFilter === 'all' ||
            (stockFilter === 'inStock' &&
                product.stockOnHand > product.reorderLevel) ||
            (stockFilter === 'lowStock' &&
                product.stockOnHand > 0 &&
                product.stockOnHand <= product.reorderLevel) ||
            (stockFilter === 'outOfStock' &&
                product.stockOnHand === 0)

        return matchesSearch && matchesStock
    })


    //get total pages
    const totalPages = Math.max(
        1,
        Math.ceil(filteredProducts.length / pageSize)
    )

    const safeCurrentPage = Math.min(currentPage, totalPages)

    const startIndex = (safeCurrentPage - 1) * pageSize


    //to make the pagination page
    const paginatedProducts = filteredProducts.slice(
        startIndex,
        startIndex + pageSize
    )

    const totalProducts = products.length

    const inventoryValue = products.reduce(
        (total, product) =>
            total + product.costPrice * product.stockOnHand,
        0
    )

    //count low stock and out of stock
    const lowStockCount = products.filter(
        (product) =>
            product.stockOnHand > 0 &&
            product.stockOnHand <= product.reorderLevel
    ).length


    const outOfStockCount = products.filter(
        (product) => product.stockOnHand === 0
    ).length

    const role = getDashboardRole(token)

    //set the admin role
    const isAdmin = role === 'Admin'

    const getProductInitials = (name) => {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word.charAt(0).toUpperCase())
            .join('')
    }

    //get stock percentage
    const getStockPercentage = (stock, reorderLevel) => {
        if (stock <= 0) return 0

        const target = Math.max(reorderLevel * 2, 1)

        return Math.min((stock / target) * 100, 100)
    }

    //detect click outside the menu
    useEffect(() => {
        if (openMenuId === null) return

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null)
            }
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setOpenMenuId(null)
            }
        }

        document.addEventListener('pointerdown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('pointerdown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [openMenuId])


    const handleArchiveProduct = async () => {
        if (!archiveProduct || !isAdmin || archiving) return

        setArchiving(true)
        setArchiveError('')

        try {
            const response = await fetch(
                `/api/products/${archiveProduct.productId}/archive`,
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
                    throw new Error('You do not have permission to archive products.')
                }

                const message = await response.text()
                throw new Error(message || 'Failed to archive product.')
            }

            setArchiveProduct(null)
            setRefreshKey((previous) => previous + 1)
        } catch (error) {
            setArchiveError(error.message)
        } finally {
            setArchiving(false)
        }
    }


    return (
        <main className="min-w-0 flex-1 p-8">

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Products & Inventory Catalog
                    </h1>

                    <p className="mt-1 text-sm text-slate-600">
                        Manage registered catalog items, stock levels,
                        and real-time inventory value.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#1F3046] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#2B405B] sm:self-auto"
                        >
                            <span className="text-lg leading-none">+</span>
                            <span>New Product</span>

                            <span className="rounded-full bg-[#344D70] px-2 py-0.5 text-[10px] text-blue-100">
                                ADMIN ONLY
                            </span>
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => setShowArchivedProducts(true)}
                            className="flex h-11 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-48"
                        >
                            <Archive size={16} />
                            View Archived
                        </button>
                    )}

                </div>

            </div>



            {/* modal for addProduct */}
            {isAdmin && showAddForm && (
                <AddProduct
                    token={token}
                    onClose={() => setShowAddForm(false)}
                    onSuccess={() => setRefreshKey((previous) => previous + 1)}
                />
            )}

            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                {/* Total Products */}
                <div className="rounded-2xl bg-gradient-to-br from-[#5B5CF0] via-[#4A58D8] to-[#1D9A8A] p-4 text-white shadow-md">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                            Total Products
                        </p>

                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                            {totalProducts} Items
                        </span>
                    </div>

                    <h3 className="mt-2 text-2xl font-bold tracking-tight">
                        {totalProducts}
                    </h3>

                    <p className="mt-1 text-xs text-white/85">
                        Items registered
                    </p>

                    <p className="mt-1 text-xs text-white/75">
                        Total products in inventory
                    </p>
                </div>

                {/* Inventory Value */}
                <div className="rounded-2xl bg-gradient-to-br from-[#5B5CF0] via-[#4448D4] to-[#168F8C] p-4 text-white shadow-md">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                            Total Inventory Value
                        </p>

                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                            MYR
                        </span>
                    </div>

                    <h3 className="mt-2 text-2xl font-bold tracking-tight">
                        {inventoryValue.toLocaleString('en-MY', {
                            style: 'currency',
                            currency: 'MYR',
                        })}
                    </h3>

                    <p className="mt-1 text-xs text-white/80">
                        Cost Price × Stock On Hand
                    </p>
                </div>


                {/* Low Stock */}
                <div className="rounded-2xl bg-gradient-to-br from-[#F6A84F] via-[#E48D37] to-[#C96B1D] p-4 text-white shadow-md">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                            Low Stock Alert
                        </p>

                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                            Action Needed
                        </span>
                    </div>

                    <h3 className="mt-2 text-2xl font-bold tracking-tight">
                        {lowStockCount}
                    </h3>

                    <p className="mt-1 text-xs text-white/85">
                        Below threshold
                    </p>

                    <p className="mt-1 text-xs text-white/75">
                        At or below reorder level
                    </p>
                </div>

                {/* Out of Stock */}
                <div className="rounded-2xl bg-gradient-to-br from-[#F26868] via-[#D94E5A] to-[#B93746] p-4 text-white shadow-md">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                            Out of Stock
                        </p>

                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                            {outOfStockCount} Products
                        </span>
                    </div>

                    <h3 className="mt-2 text-2xl font-bold tracking-tight">
                        {outOfStockCount}
                    </h3>

                    <p className="mt-1 text-xs text-white/85">
                        Zero stock remaining
                    </p>

                    <p className="mt-1 text-xs text-white/75">
                        Stock on hand: 0
                    </p>
                </div>

            </div>


            <div className="mb-6 flex flex-col gap-4 rounded-[36px] bg-white/80 p-5 shadow-sm backdrop-blur-xl xl:flex-row xl:items-center">

                {/* Search */}
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-[#EDF2FC] px-5 py-3">
                    <Search size={20} className="shrink-0 text-slate-600" />

                    <input
                        type="search"
                        placeholder="Search by Product Name or SKU..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setCurrentPage(1)
                        }}
                        aria-label="Search products"
                        className="w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500"
                    />
                </div>

                {/* Stock filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { label: 'All Products', value: 'all', count: products.length },
                        {
                            label: 'In Stock',
                            value: 'inStock',
                            count: products.filter(
                                (p) => p.stockOnHand > p.reorderLevel
                            ).length,
                        },
                        {
                            label: 'Low Stock',
                            value: 'lowStock',
                            count: products.filter(
                                (p) => p.stockOnHand > 0 && p.stockOnHand <= p.reorderLevel
                            ).length,
                        },
                        {
                            label: 'Out of Stock',
                            value: 'outOfStock',
                            count: products.filter(
                                (p) => p.stockOnHand === 0
                            ).length,
                        },
                    ].map((filter) => (
                        <button
                            key={filter.value}
                            type="button"
                            onClick={() => {
                                setStockFilter(filter.value)
                                setCurrentPage(1)
                            }}
                            aria-pressed={stockFilter === filter.value}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${stockFilter === filter.value
                                ? 'bg-[#1F3046] text-white shadow-md'
                                : 'text-slate-600 hover:bg-[#EDF2FC]'
                                }`}
                        >
                            {filter.label} ({filter.count})
                        </button>
                    ))}
                </div>

                {/* Product counter */}
                <div className="flex shrink-0 items-center gap-2 text-sm text-slate-600">
                    <ListFilter size={18} />

                    <span>
                        Showing {filteredProducts.length} of {products.length} products
                    </span>
                </div>

            </div>

            {loading && (
                <div
                    role="status"
                    className="mt-6 rounded-xl bg-blue-50 p-4 text-center text-sm font-medium text-blue-700"
                >
                    Loading products...
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5"
                >
                    <p className="text-sm font-medium text-red-700">
                        Failed to load products: {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => setRefreshKey((prev) => prev + 1)}
                        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            )}


            {!loading && !error && (
                <div className="overflow-x-auto rounded-3xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-xl">

                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#EDF2FC]/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="p-4">Product</th>
                                <th className="p-4">SKU</th>
                                <th className="p-4">Selling Price</th>
                                <th className="p-4 text-center">Stock</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedProducts.map((product) => (
                                <tr
                                    key={product.productId}
                                    className="border-t border-slate-100 transition-colors hover:bg-indigo-50/60"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                                                {getProductInitials(product.productName)}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-900">
                                                    {product.productName}
                                                </p>
                                            </div>
                                        </div>
                                    </td>


                                    <td className="p-4">{product.sku}</td>
                                    <td className="p-4">
                                        RM {product.sellingPrice.toFixed(2)}
                                    </td>


                                    <td className="px-5 py-4">
                                        <div className="min-w-32">
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <span className="font-semibold text-slate-800">
                                                    {product.stockOnHand} units
                                                </span>

                                                <span className="text-xs text-slate-500">
                                                    Min: {product.reorderLevel}
                                                </span>
                                            </div>

                                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className={`h-full rounded-full transition-all ${product.stockOnHand === 0
                                                        ? 'bg-red-500'
                                                        : product.stockOnHand <= product.reorderLevel
                                                            ? 'bg-amber-500'
                                                            : 'bg-indigo-500'
                                                        }`}
                                                    style={{
                                                        width: `${getStockPercentage(
                                                            product.stockOnHand,
                                                            product.reorderLevel
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${product.stockOnHand === 0
                                                ? 'bg-red-100 text-red-700'
                                                : product.stockOnHand <= product.reorderLevel
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                        >
                                            <span
                                                className={`h-2 w-2 rounded-full ${product.stockOnHand === 0
                                                    ? 'bg-red-500'
                                                    : product.stockOnHand <= product.reorderLevel
                                                        ? 'bg-amber-500'
                                                        : 'bg-emerald-500'
                                                    }`}
                                            />

                                            {product.stockOnHand === 0
                                                ? 'Out of Stock'
                                                : product.stockOnHand <= product.reorderLevel
                                                    ? 'Low Stock'
                                                    : 'In Stock'}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4 text-center">
                                        <div
                                            ref={openMenuId === product.productId ? menuRef : null}
                                            className="relative inline-block"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenMenuId((previous) =>
                                                        previous === product.productId ? null : product.productId
                                                    )
                                                }
                                                aria-label={`Actions for ${product.productName}`}
                                                aria-expanded={openMenuId === product.productId}
                                                className="rounded-full p-2 text-slate-500 hover:bg-indigo-100"
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {openMenuId === product.productId && (
                                                <div className="absolute right-0 z-20 w-48 rounded-xl border border-slate-100 bg-white p-2 text-left shadow-xl ">
                                                    {[
                                                        'View Details',
                                                        'Edit Product',
                                                        'Stock In',
                                                        'Stock History',
                                                        'Archive Product',

                                                    ].map((action) => (
                                                        <button
                                                            key={action}
                                                            type="button"
                                                            disabled={
                                                                action !== 'View Details' &&
                                                                !(action === 'Edit Product' && isAdmin) &&
                                                                !(action === 'Stock In' && isAdmin) &&
                                                                action !== 'Stock History' &&
                                                                !(action === 'Archive Product' && isAdmin)
                                                            }

                                                            onClick={() => {
                                                                if (action === 'View Details') {
                                                                    setSelectedProduct(product)
                                                                }

                                                                if (action === 'Edit Product' && isAdmin) {
                                                                    setEditingProduct(product)
                                                                }

                                                                if (action === 'Stock In' && isAdmin) {
                                                                    setStockInProduct(product)
                                                                }

                                                                if (action === 'Stock History') {
                                                                    setStockHistoryProduct(product)
                                                                }

                                                                if (action === 'Archive Product' && isAdmin) {
                                                                    setArchiveProduct(product)
                                                                }

                                                                setOpenMenuId(null)
                                                            }}


                                                            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${action === 'View Details' || (action === 'Edit Product' && isAdmin) || (action === 'Stock In' && isAdmin) || action === 'Stock History' || (action === 'Archive Product' && isAdmin)
                                                                ? 'cursor-pointer text-slate-700 hover:bg-slate-100'
                                                                : action === 'Archive Product'
                                                                    ? 'cursor-not-allowed text-red-400'
                                                                    : 'cursor-not-allowed text-slate-400'
                                                                }`}
                                                        >
                                                            {action}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>


                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <p className="p-6 text-center text-slate-500">
                            No products found.
                        </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 px-3 py-3 shadow-sm sm:gap-4 sm:px-5">

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">
                                Rows per page:
                            </span>

                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600">
                                Page {safeCurrentPage} of {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={safeCurrentPage === 1}
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                className="rounded-full bg-[#1F3046] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <button
                                type="button"
                                disabled={safeCurrentPage === totalPages}
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                className="rounded-full bg-[#1F3046] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>





                </div>

            )}


            {/* action for product details */}
            {selectedProduct && (
                <ProductDetails
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}

            {isAdmin && editingProduct && (
                <EditProduct
                    product={editingProduct}
                    token={token}
                    onClose={() => setEditingProduct(null)}
                    onSuccess={() => setRefreshKey((previous) => previous + 1)}
                />
            )}

            {isAdmin && stockInProduct && (
                <StockInModal
                    product={stockInProduct}
                    token={token}
                    onClose={() => setStockInProduct(null)}
                    onSuccess={() => setRefreshKey((previous) => previous + 1)}
                />
            )}

            {stockHistoryProduct && (
                <StockHistoryModal
                    product={stockHistoryProduct}
                    token={token}
                    onClose={() => setStockHistoryProduct(null)}
                />
            )}

            {isAdmin && archiveProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !archiving) {
                            setArchiveProduct(null)
                            setArchiveError('')
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="archive-title"
                        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
                    >
                        <h2
                            id="archive-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            Archive Product
                        </h2>

                        <p className="mt-3 text-sm text-slate-600">
                            Are you sure you want to archive{' '}
                            <strong>{archiveProduct.productName}</strong>?
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            This product will be hidden from your active inventory,
                            but its historical records will be preserved.
                        </p>



                        <div className="mt-6 flex justify-end gap-3">

                            {archiveError && (
                                <p role="alert" className="mt-3 text-sm text-red-600">
                                    {archiveError}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setArchiveProduct(null)
                                    setArchiveError('')
                                }}
                                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleArchiveProduct}
                                disabled={archiving}
                                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {archiving ? 'Archiving...' : 'Confirm Archive'}
                            </button>


                        </div>
                    </div>
                </div>
            )}

            {isAdmin && showArchivedProducts && (
                <ArchivedProductsModal
                    token={token}
                    onClose={() => setShowArchivedProducts(false)}
                    onSuccess={() => setRefreshKey((previous) => previous + 1)}
                />
            )}

        </main>
    )
}

export default Products