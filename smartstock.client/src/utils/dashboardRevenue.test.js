import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    buildRevenueSeries,
    getBusinessDateKey,
    getLastSevenDayKeys,
} from './dashboardRevenue.js'

test('getBusinessDateKey treats naive timestamps as Malaysia wall-clock time', () => {
    assert.equal(getBusinessDateKey('2026-11-20T00:00:00'), '2026-11-20')
    assert.equal(getBusinessDateKey('2026-11-20T23:59:59'), '2026-11-20')
    assert.equal(getBusinessDateKey('2026-11-21T00:00:00'), '2026-11-21')
})

test('getBusinessDateKey converts explicit UTC timestamps to Malaysia dates', () => {
    assert.equal(getBusinessDateKey('2026-11-20T15:59:00Z'), '2026-11-20')
    assert.equal(getBusinessDateKey('2026-11-20T16:00:00Z'), '2026-11-21')
})

test('getLastSevenDayKeys returns seven consecutive Malaysia business dates', () => {
    const keys = getLastSevenDayKeys(new Date('2026-11-20T10:00:00Z'))

    assert.equal(keys.length, 7)
    assert.equal(keys[0], '2026-11-14')
    assert.equal(keys[6], '2026-11-20')
})

test('buildRevenueSeries uses inclusive start and exclusive end boundaries', () => {
    const sales = [
        { soldAt: '2026-11-14T00:00:00', totalAmount: 10 },
        { soldAt: '2026-11-13T23:59:59', totalAmount: 999 },
        { soldAt: '2026-11-20T23:59:59', totalAmount: 20 },
        { soldAt: '2026-11-21T00:00:00', totalAmount: 999 },
    ]

    const series = buildRevenueSeries(sales, new Date('2026-11-20T10:00:00Z'))

    assert.equal(series.length, 7)
    assert.equal(series[0].value, 10)
    assert.equal(series[6].value, 20)
    assert.equal(series.reduce((sum, day) => sum + day.value, 0), 30)
})
