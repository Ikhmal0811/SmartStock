import { useEffect, useState } from 'react'
import { Archive, X } from 'lucide-react'

function ArchivedProductsModal({ token, onClose }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Archived
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ArchivedProductsModal