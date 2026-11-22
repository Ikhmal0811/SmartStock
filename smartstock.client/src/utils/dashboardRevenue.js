export const SALES_TIME_ZONE = 'Asia/Kuala_Lumpur'
export const MALAYSIA_UTC_OFFSET_HOURS = 8

const NAIVE_TIMESTAMP =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SALES_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
})

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
})

const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
})

export const formatCurrency = (value) =>
    `RM ${Number(value || 0).toLocaleString('en-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`

// The API stores naive "timestamp without time zone" values as Malaysia
// wall-clock time. Parse those strings explicitly as UTC+08:00 instead of
// letting the browser interpret them in its own local timezone.
export function parseSaleTimestamp(value) {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value
    }

    if (typeof value !== 'string') return null

    const match = value.trim().match(NAIVE_TIMESTAMP)
    if (match) {
        const [
            ,
            year,
            month,
            day,
            hour = '0',
            minute = '0',
            second = '0',
            fraction = '',
        ] = match

        const milliseconds = Number((fraction + '000').slice(0, 3))
        const wallClockAsUtc = Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            Number(second),
            milliseconds
        )

        return new Date(
            wallClockAsUtc - MALAYSIA_UTC_OFFSET_HOURS * 60 * 60 * 1000
        )
    }

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getBusinessDateKey(value) {
    const parsed = parseSaleTimestamp(value)
    if (!parsed) return ''

    const parts = dateKeyFormatter.formatToParts(parsed)
    const part = (type) => parts.find((item) => item.type === type)?.value

    return `${part('year')}-${part('month')}-${part('day')}`
}

export function getLastSevenDayKeys(now = new Date()) {
    const todayKey = getBusinessDateKey(now)
    const today = new Date(`${todayKey}T00:00:00Z`)

    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(today)
        day.setUTCDate(day.getUTCDate() - (6 - index))
        return day.toISOString().slice(0, 10)
    })
}

export function buildRevenueSeries(sales, now = new Date()) {
    const keys = getLastSevenDayKeys(now)
    const totals = new Map(keys.map((key) => [key, 0]))

    sales.forEach((sale) => {
        const key = getBusinessDateKey(sale.soldAt)

        if (totals.has(key)) {
            totals.set(
                key,
                totals.get(key) + Number(sale.totalAmount || 0)
            )
        }
    })

    return keys.map((key) => {
        const date = new Date(`${key}T00:00:00Z`)

        return {
            date: key,
            day: weekdayFormatter.format(date),
            shortDate: shortDateFormatter.format(date),
            value: Number(totals.get(key).toFixed(2)),
        }
    })
}

export function getTodaySalesMetrics(sales, now = new Date()) {
    const todayKey = getBusinessDateKey(now)
    const todaySales = sales.filter(
        (sale) => getBusinessDateKey(sale.soldAt) === todayKey
    )

    return {
        revenue: Number(
            todaySales
                .reduce(
                    (sum, sale) => sum + Number(sale.totalAmount || 0),
                    0
                )
                .toFixed(2)
        ),
        count: todaySales.length,
    }
}
