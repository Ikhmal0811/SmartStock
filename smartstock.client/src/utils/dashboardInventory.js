// Stock rules mirror StockManagement.jsx / Products.jsx:
// out of stock = zero units; low stock = above zero but at/below reorder level;
// healthy = above reorder level. Categories are mutually exclusive.

export const INVENTORY_STATUS = {
  healthy: { label: 'Healthy Stock', color: '#14B8A6' },
  lowStock: { label: 'Low Stock', color: '#F59E0B' },
  outOfStock: { label: 'Out of Stock', color: '#EF4444' },
}

export function classifyStock(product) {
  const stock = Number(product?.stockOnHand ?? 0)
  const reorderLevel = Number(product?.reorderLevel ?? 0)

  if (stock === 0) return 'outOfStock'
  if (stock > 0 && stock <= reorderLevel) return 'lowStock'
  return 'healthy'
}

export function buildInventorySummary(products) {
  const eligible = Array.isArray(products) ? products : []
  const counts = { healthy: 0, lowStock: 0, outOfStock: 0 }

  eligible.forEach((product) => {
    counts[classifyStock(product)] += 1
  })

  const inventoryValue = eligible.reduce(
    (sum, product) =>
      sum +
      Number(product.costPrice || 0) * Number(product.stockOnHand || 0),
    0
  )

  return {
    inventoryValue: Number(inventoryValue.toFixed(2)),
    totalProducts: eligible.length,
    ...counts,
    alertCount: counts.lowStock + counts.outOfStock,
    healthData: Object.entries(INVENTORY_STATUS).map(([key, meta]) => ({
      label: meta.label,
      value: counts[key],
      color: meta.color,
    })),
  }
}

export function getStockAlerts(products, limit = 5) {
  const statusRank = { outOfStock: 0, lowStock: 1 }

  return (Array.isArray(products) ? products : [])
    .map((product) => {
      const status = classifyStock(product)
      const stock = Number(product?.stockOnHand ?? 0)
      const reorderLevel = Number(product?.reorderLevel ?? 0)

      return {
        product,
        status,
        stock,
        reorderLevel,
        ratio: stock / Math.max(reorderLevel, 1),
      }
    })
    .filter((item) => statusRank[item.status] !== undefined)
    .sort((a, b) => {
      const nameA = String(a.product?.productName ?? '')
      const nameB = String(b.product?.productName ?? '')
      const idA = Number(a.product?.productId)
      const idB = Number(b.product?.productId)

      return (
        statusRank[a.status] - statusRank[b.status] ||
        a.ratio - b.ratio ||
        nameA.localeCompare(nameB) ||
        (Number.isFinite(idA) && Number.isFinite(idB) ? idA - idB : 0)
      )
    })
    .slice(0, limit)
    .map(({ product, status }) => ({ ...product, stockStatus: status }))
}

export function buildTopSellingProducts(rows, limit = 5) {
  const byProduct = new Map()

  ;(Array.isArray(rows) ? rows : []).forEach((row) => {
    const productId = Number(row.productId)
    const quantity = Number(row.quantity || 0)
    const existing = byProduct.get(productId)

    if (existing) {
      existing.quantity += quantity
      return
    }

    byProduct.set(productId, {
      productId,
      name: row.productName || `Product ${productId}`,
      quantity,
    })
  })

  return Array.from(byProduct.values())
    .sort(
      (a, b) =>
        b.quantity - a.quantity ||
        String(a.name).localeCompare(String(b.name))
    )
    .slice(0, limit)
    .map((product, index) => ({ ...product, rank: index + 1 }))
}
