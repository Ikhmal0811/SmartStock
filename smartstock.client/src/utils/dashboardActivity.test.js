import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatSaleDateTime, getRecentSales } from './dashboardActivity.js'

test('getRecentSales sorts by soldAt descending with deterministic tie-break', () => {
    const sales = [
        { saleId: 1, soldAt: '2026-11-18T09:00:00', totalAmount: 10 },
        { saleId: 2, soldAt: '2026-11-20T17:00:00', totalAmount: 20 },
        { saleId: 3, soldAt: '2026-11-20T17:00:00', totalAmount: 30 },
        { saleId: 4, soldAt: '2026-11-19T09:00:00', totalAmount: 40 },
        { saleId: 5, soldAt: '2026-11-17T09:00:00', totalAmount: 50 },
        { saleId: 6, soldAt: '2026-11-16T09:00:00', totalAmount: 60 },
    ]

    const result = getRecentSales(sales)

    assert.deepEqual(
        result.map((sale) => sale.saleId),
        [3, 2, 4, 1, 5]
    )
})

test('getRecentSales preserves fractional-second ordering', () => {
    const sales = [
        {
            saleId: 1,
            soldAt: '2026-11-20T17:00:00.100000',
            totalAmount: 10,
        },
        {
            saleId: 2,
            soldAt: '2026-11-20T17:00:00.900000',
            totalAmount: 20,
        },
    ]

    assert.deepEqual(getRecentSales(sales).map((sale) => sale.saleId), [2, 1])
})

test('getRecentSales handles empty and invalid inputs', () => {
    assert.deepEqual(getRecentSales([]), [])
    assert.deepEqual(getRecentSales(undefined), [])
})

test('formatSaleDateTime handles missing and invalid timestamps', () => {
    assert.equal(formatSaleDateTime(''), '—')
    assert.equal(formatSaleDateTime('not-a-date'), '—')
    assert.match(formatSaleDateTime('2026-11-20T18:18:40'), /2026/)
})
