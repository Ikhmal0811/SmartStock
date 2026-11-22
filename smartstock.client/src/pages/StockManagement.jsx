import { useEffect, useState } from 'react'
import { Boxes, AlertTriangle, PackageX, PackagePlus, PackageMinus } from 'lucide-react'
import StockInModal from '../components/StockInModal'
import StockProductSelectorModal from '../components/StockProductSelectorModal'
import StockOutModal from '../components/StockOutModal'
import { getDashboardRole } from '../utils/dashboardPermissions'

function StockManagement({ token }) {

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alertSearch, setAlertSearch] = useState('')
  const [stockInProduct, setStockInProduct] = useState(null)
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [stockOutProduct, setStockOutProduct] = useState(null)
  const [showStockOutSelector, setShowStockOutSelector] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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

        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.')
        }

        if (response.status === 403) {
          throw new Error('You do not have permission to view inventory.')
        }

        if (!response.ok) {
          throw new Error('Failed to load inventory data.')
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

  const totalUnits = products.reduce(
    (total, product) => total + Number(product.stockOnHand),
    0
  )

  const lowStock = products.filter(
    (product) =>
      Number(product.stockOnHand) > 0 &&
      Number(product.stockOnHand) <= Number(product.reorderLevel)
  ).length

  const outOfStock = products.filter(
    (product) => Number(product.stockOnHand) === 0
  ).length


  //calculate products to replenish and sort it to the top of the page
  const replenishmentProducts = products
    .filter(
      (product) =>
        Number(product.stockOnHand) <= Number(product.reorderLevel)
    )
    .sort((a, b) => {
      const stockA = Number(a.stockOnHand)
      const stockB = Number(b.stockOnHand)

      // Out of stock products come first
      if (stockA === 0 && stockB !== 0) return -1
      if (stockB === 0 && stockA !== 0) return 1

      // Then sort by the lowest stock percentage
      const ratioA = stockA / Math.max(Number(a.reorderLevel), 1)
      const ratioB = stockB / Math.max(Number(b.reorderLevel), 1)

      return ratioA - ratioB
    })

  const filteredAlerts = replenishmentProducts.filter((product) => {
    const keyword = alertSearch.toLowerCase().trim()

    return (
      product.productName.toLowerCase().includes(keyword) ||
      product.sku.toLowerCase().includes(keyword)
    )
  })


  //check user role
  const role = getDashboardRole(token)

  const isAdmin = role === 'Admin'

  const handleOpenStockInSelector = () => {
    if (isAdmin) {
      setShowProductSelector(true)
    }
  }

  const handleStockInProductSelect = (product) => {
    setShowProductSelector(false)
    setStockInProduct(product)
  }

  const handleOpenStockOutSelector = () => {
    if (isAdmin) {
      setShowStockOutSelector(true)
    }
  }

  const handleStockOutProductSelect = (product) => {
    setShowStockOutSelector(false)
    setStockOutProduct(product)
  }


  return (
    <div className="space-y-6">

      {/* ================= PAGE HEADER ================= */}
      <div className="rounded-3xl bg-white/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Stock Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor inventory levels and manage stock movements.
            </p>
          </div>

          {/* Stock Operation Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenStockInSelector}
                className="flex h-11 w-40 items-center justify-center gap-2 rounded-full bg-[#20334F] text-sm font-semibold text-white transition hover:bg-[#304967]"
              >
                <PackagePlus size={17} />
                Stock In
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenStockOutSelector}
                className="flex h-11 w-40 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <PackageMinus size={17} />
                Stock Out
              </button>
            )}

          </div>
        </div>
      </div>


      {/* ================= INVENTORY OVERVIEW ================= */}
      <div className="rounded-3xl bg-[#6158E5] p-6 text-white shadow-lg">

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes size={20} className="text-cyan-300" />

            <h2 className="text-sm font-semibold">
              Inventory Overview
            </h2>
          </div>

          <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
            Active Catalog
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-200">
            Loading inventory...
          </p>
        ) : error ? (
          <p className="text-sm text-red-200">
            {error}
          </p>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-200">
            No active products to summarize.
          </p>
        ) : (
          <>
            <p className="text-4xl font-bold">
              {totalUnits.toLocaleString('en-MY')}

              <span className="ml-2 text-sm font-normal text-slate-200">
                Units
              </span>
            </p>

            <p className="mt-2 text-xs text-slate-200">
              Total stock across all active products
            </p>

            <div className="my-6 border-t border-white/15" />

            <div className="grid grid-cols-2 gap-3">

              {/* Low Stock */}
              <div className="rounded-2xl bg-white/10 p-4">
                <AlertTriangle
                  size={18}
                  className="mb-2 text-amber-300"
                />

                <p className="text-xs text-slate-200">
                  Low Stock
                </p>

                <p className="text-xl font-bold text-amber-300">
                  {lowStock} items
                </p>
              </div>

              {/* Out of Stock */}
              <div className="rounded-2xl bg-white/10 p-4">
                <PackageX
                  size={18}
                  className="mb-2 text-red-300"
                />

                <p className="text-xs text-slate-200">
                  Out of Stock
                </p>

                <p className="text-xl font-bold text-red-300">
                  {outOfStock} items
                </p>
              </div>

            </div>
          </>
        )}
      </div>


      {/* ================= REPLENISHMENT ALERTS ================= */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">

        <div className="mb-5 flex items-center justify-between">

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                Replenishment Alerts
              </h2>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                {replenishmentProducts.length}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Products that need restocking
            </p>
          </div>


          <AlertTriangle
            size={22}
            className="text-amber-500"
          />
        </div>
        <div className="mb-5 flex gap-2">
          <input
            type="search"
            placeholder="Search product name or SKU..."
            value={alertSearch}
            onChange={(e) => setAlertSearch(e.target.value)}
            aria-label="Search replenishment alerts"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400"
          />

          {alertSearch && (
            <button
              type="button"
              onClick={() => setAlertSearch('')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">
            Loading alerts...
          </p>
        ) : error ? (
          <p className="text-sm text-red-600">
            {error}
          </p>
        ) : products.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No active products found.
          </p>
        ) : replenishmentProducts.length === 0 ? (
          <p className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
            All products have sufficient stock.
          </p>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No matching alerts found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Try searching with a different product name or SKU.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {filteredAlerts.map((product) => {
              const stock = Number(product.stockOnHand)
              const reorderLevel = Number(product.reorderLevel)

              const percentage =
                reorderLevel > 0
                  ? Math.min((stock / reorderLevel) * 100, 100)
                  : 0

              return (
                <div key={product.productId}>

                  <div className="mb-2 flex items-center justify-between gap-3">

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {product.productName}
                      </p>

                      <p className="text-xs text-slate-400">
                        {product.sku}
                      </p>

                      <span
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${stock === 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                          }`}
                      >
                        {stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </div>



                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold ${stock === 0 ? 'text-red-600' : 'text-amber-600'
                          }`}
                      >
                        {stock} / {reorderLevel}
                      </span>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setStockInProduct(product)}
                          className="rounded-full bg-[#20334F] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#304967]"
                        >
                          Stock In
                        </button>
                      )}
                    </div>



                  </div>

                  {/* Stock Level Progress Bar */}
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${stock === 0 ? 'bg-red-500' : 'bg-amber-400'
                        }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                </div>
              )
            })}

          </div>
        )}
      </div>

      {isAdmin && showProductSelector && (
        <StockProductSelectorModal
          products={products}
          onSelect={handleStockInProductSelect}
          onClose={() => setShowProductSelector(false)}
        />
      )}

      {isAdmin && showStockOutSelector && (
        <StockProductSelectorModal
          products={products}
          onSelect={handleStockOutProductSelect}
          onClose={() => setShowStockOutSelector(false)}
        />
      )}

      {isAdmin && stockInProduct && (
        <StockInModal
          product={stockInProduct}
          token={token}
          onClose={() => setStockInProduct(null)}
          onSuccess={() => {
            setStockInProduct(null)
            setRefreshKey((previous) => previous + 1)
          }}
        />
      )}

      {isAdmin && stockOutProduct && (
        <StockOutModal
          product={stockOutProduct}
          token={token}
          onClose={() => setStockOutProduct(null)}
          onSuccess={() => {
            setStockOutProduct(null)
            setRefreshKey((previous) => previous + 1)
          }}
        />
      )}
    </div>
  )
}

export default StockManagement
