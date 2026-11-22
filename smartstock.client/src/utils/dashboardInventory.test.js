import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    buildInventorySummary,
    buildTopSellingProducts,
    classifyStock,
    getStockAlerts,
} from './dashboardInventory.js'

test('classifyStock follows Stock Management rules', () => {
    assert.equal(
        classifyStock({ stockOnHand: 0, reorderLevel: 10 }),
        'outOfStock'
    )
    assert.equal(
        classifyStock({ stockOnHand: 5, reorderLevel: 10 }),
        'lowStock'
    )
    assert.equal(
        classifyStock({ stockOnHand: 10, reorderLevel: 10 }),
        'lowStock'
    )
    assert.equal(
        classifyStock({ stockOnHand: 11, reorderLevel: 10 }),
        'healthy'
    )
})

test('buildInventorySummary uses cost price and mutually exclusive states', () => {
    const products = [
        { costPrice: 10, stockOnHand: 0, reorderLevel: 5 },
        { costPrice: 20, stockOnHand: 4, reorderLevel: 5 },
        { costPrice: 30, stockOnHand: 20, reorderLevel: 5 },
        { costPrice: 5.5, stockOnHand: 2, reorderLevel: 1 },
    ]

    const summary = buildInventorySummary(products)

    assert.equal(summary.inventoryValue, 691)
    assert.equal(summary.totalProducts, 4)
    assert.equal(summary.healthy, 2)
    assert.equal(summary.lowStock, 1)
    assert.equal(summary.outOfStock, 1)
    assert.equal(summary.alertCount, 2)
    assert.equal(
        summary.healthData.reduce((total, item) => total + item.value, 0),
        summary.totalProducts
    )
    assert.deepEqual(
        summary.healthData.map((item) => item.color),
        ['#14B8A6', '#F59E0B', '#EF4444']
    )
})

test('buildInventorySummary handles empty inventory', () => {
    const summary = buildInventorySummary([])

    assert.equal(summary.inventoryValue, 0)
    assert.equal(summary.totalProducts, 0)
    assert.equal(summary.alertCount, 0)
    assert.ok(summary.healthData.every((item) => item.value === 0))
})

test('buildTopSellingProducts merges duplicates and ranks by quantity', () => {
    const rows = [
        { productId: 2, productName: 'Mouse', quantity: 5 },
        { productId: 1, productName: 'Keyboard', quantity: 12 },
        { productId: 2, productName: 'Mouse', quantity: 8 },
        { productId: 3, productName: 'Cable', quantity: 3 },
        { productId: 4, productName: 'Stand', quantity: 9 },
        { productId: 5, productName: 'Webcam', quantity: 1 },
        { productId: 6, productName: 'Hub', quantity: 2 },
    ]

    const result = buildTopSellingProducts(rows)

    assert.equal(result.length, 5)
    assert.deepEqual(
        result.map((item) => item.productId),
        [2, 1, 4, 3, 6]
    )
    assert.equal(result[0].quantity, 13)
    assert.deepEqual(
        result.map((item) => item.rank),
        [1, 2, 3, 4, 5]
    )
})

test('buildTopSellingProducts handles zero sales', () => {
    assert.deepEqual(buildTopSellingProducts([]), [])
})

test('getStockAlerts filters healthy products and puts out-of-stock first', () => {
    const products = [
        { productId: 1, productName: 'Healthy', stockOnHand: 50, reorderLevel: 10 },
        { productId: 2, productName: 'Low A', stockOnHand: 5, reorderLevel: 10 },
        { productId: 3, productName: 'Out A', stockOnHand: 0, reorderLevel: 10 },
        { productId: 4, productName: 'Low B', stockOnHand: 8, reorderLevel: 10 },
        { productId: 5, productName: 'Out B', stockOnHand: 0, reorderLevel: 5 },
        { productId: 6, productName: 'Low C', stockOnHand: 2, reorderLevel: 10 },
        { productId: 7, productName: 'Low D', stockOnHand: 1, reorderLevel: 10 },
    ]

    const alerts = getStockAlerts(products)

    assert.deepEqual(
        alerts.map((product) => product.productId),
        [3, 5, 7, 6, 2]
    )
    assert.deepEqual(
        alerts.map((product) => product.stockStatus),
        ['outOfStock', 'outOfStock', 'lowStock', 'lowStock', 'lowStock']
    )
})

test('getStockAlerts uses the shared classification and handles empty input', () => {
    const products = [
        { productId: 1, productName: 'Fine', stockOnHand: 99, reorderLevel: 10 },
        {
            productId: 2,
            productName: 'Empty',
            stockOnHand: 0,
            reorderLevel: 5,
        },
    ]

    const alerts = getStockAlerts(products)

    assert.equal(alerts.length, 1)
    assert.equal(alerts[0].stockStatus, classifyStock(products[1]))
    assert.deepEqual(getStockAlerts([]), [])
})
