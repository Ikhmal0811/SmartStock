import { parseSaleTimestamp, SALES_TIME_ZONE } from './dashboardRevenue.js'

const saleDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: SALES_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
})

const sortId = (a, b) => {
    const idA = Number(a)
    const idB = Number(b)

    if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) {
        return idB - idA
    }

    return String(b ?? '').localeCompare(String(a ?? ''))
}

export function getRecentSales(sales, limit = 5) {
    return (Array.isArray(sales) ? sales : [])
        .map((sale) => ({
            sale,
            soldTime: parseSaleTimestamp(sale?.soldAt)?.getTime() ?? 0,
        }))
        .sort((a, b) => {
            const timeA = Number.isFinite(a.soldTime) ? a.soldTime : 0
            const timeB = Number.isFinite(b.soldTime) ? b.soldTime : 0

            return timeB - timeA || sortId(a.sale?.saleId, b.sale?.saleId)
        })
        .slice(0, limit)
        .map(({ sale }) => sale)
}

export function formatSaleDateTime(value) {
    const parsed = parseSaleTimestamp(value)
    if (!parsed) return '—'

    return saleDateTimeFormatter.format(parsed).replace(',', ' ·')
}
