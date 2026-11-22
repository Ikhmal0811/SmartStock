import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import {
    Plus,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    ReceiptText,
    ShoppingCart,
} from 'lucide-react'
import SaleDetailsPanel from '../components/SaleDetailsPanel'
import CreateSaleModal from '../components/CreateSaleModal'
import { canCreateSale } from '../utils/dashboardPermissions'
import { formatMoney } from '../utils/formatMoney'

const PAGE_SIZE = 5
const MY_TZ = 'Asia/Kuala_Lumpur'
const MONTHS = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

const dateKey = (value) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: MY_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date(value))

    const part = (type) => parts.find((p) => p.type === type)?.value

    return `${part('year')}-${part('month')}-${part('day')}`
}

const daysAgo = (key, today) =>
    Math.round(
        (Date.parse(`${today}T00:00:00Z`) -
            Date.parse(`${key}T00:00:00Z`)) /
            86400000
    )

const formatGroupDate = (key) => {
    const [year, month, day] = key.split('-')
    return `${day} ${MONTHS[Number(month) - 1]} ${year}`
}

const formatTime = (value) =>
    new Intl.DateTimeFormat('en-MY', {
        timeZone: MY_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(value))

function Sales({ token }) {
    const location = useLocation()
    const canCreate = canCreateSale(token)
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [quickFilter, setQuickFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [selectedSaleId, setSelectedSaleId] = useState(null)
    const [detailsById, setDetailsById] = useState({})
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(
        () => canCreate && Boolean(location.state?.openNewSale)
    )
    const [refreshKey, setRefreshKey] = useState(0)
    const pendingSelectionRef = useRef(null)

    useEffect(() => {
        const controller = new AbortController()

        const loadSales = async () => {
            setLoading(true)
            setError('')

            try {
                const response = await fetch('/api/sales', {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                })

                if (response.status === 401) {
                    throw new Error('Session expired. Please log in again.')
                }

                if (response.status === 403) {
                    throw new Error('You do not have permission to view sales.')
                }

                if (!response.ok) {
                    throw new Error('Unable to load sales.')
                }

                const data = await response.json()
                const list = Array.isArray(data) ? data : []
                const pending = pendingSelectionRef.current
                pendingSelectionRef.current = null

                setSales(list)
                setSelectedSaleId((current) => {
                    if (pending !== null) return pending
                    if (
                        current !== null &&
                        list.some((sale) => sale.saleId === current)
                    ) {
                        return current
                    }
                    return list.length > 0 ? list[0].saleId : null
                })
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Unable to load sales.')
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        loadSales()
        return () => controller.abort()
    }, [token, refreshKey])

    const filteredSales = useMemo(() => {
        const term = search.trim()
        const today = dateKey(new Date())

        return sales.filter((sale) => {
            if (term && !String(sale.saleId).includes(term)) return false

            const key = dateKey(sale.soldAt)

            if (quickFilter === 'today' && key !== today) return false

            if (dateFilter !== 'all') {
                const diff = daysAgo(key, today)
                const limit = Number(dateFilter)

                if (diff < 0 || diff >= limit) return false
            }

            return true
        })
    }, [sales, search, quickFilter, dateFilter])

    const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)

    const pagedSales = useMemo(
        () =>
            filteredSales.slice(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE
            ),
        [filteredSales, currentPage]
    )

    const clearSelectionIfHidden = (term, quick, date) => {
        if (selectedSaleId === null) return

        const today = dateKey(new Date())
        const stillVisible = sales.some((sale) => {
            if (sale.saleId !== selectedSaleId) return false

            if (term && !String(sale.saleId).includes(term)) return false

            const key = dateKey(sale.soldAt)

            if (quick === 'today' && key !== today) return false

            if (date !== 'all') {
                const diff = daysAgo(key, today)
                if (diff < 0 || diff >= Number(date)) return false
            }

            return true
        })

        if (!stillVisible) setSelectedSaleId(null)
    }

    useEffect(() => {
        const ids = pagedSales.map((sale) => sale.saleId)

        if (ids.length === 0) return

        const controller = new AbortController()

        const loadDetails = async () => {
            setDetailsLoading(true)

            try {
                const entries = await Promise.all(
                    ids.map(async (id) => {
                        const response = await fetch(`/api/sales/${id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                            signal: controller.signal,
                        })

                        if (!response.ok) {
                            throw new Error(`Unable to load sale ${id}.`)
                        }

                        return [id, await response.json()]
                    })
                )

                if (!controller.signal.aborted) {
                    setDetailsById(Object.fromEntries(entries))
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Unable to load sale details.')
                }
            } finally {
                if (!controller.signal.aborted) {
                    setDetailsLoading(false)
                }
            }
        }

        loadDetails()
        return () => controller.abort()
    }, [pagedSales, token])

    const groups = useMemo(() => {
        const today = dateKey(new Date())
        const yesterdayDate = new Date(`${today}T00:00:00Z`)
        yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
        const yesterday = yesterdayDate.toISOString().slice(0, 10)
        const map = new Map()

        pagedSales.forEach((sale) => {
            const key = dateKey(sale.soldAt)

            if (!map.has(key)) {
                let label = formatGroupDate(key)

                if (key === today) label = `TODAY — ${label}`
                else if (key === yesterday) label = `YESTERDAY — ${label}`

                map.set(key, { key, label, sales: [] })
            }

            map.get(key).sales.push(sale)
        })

        return Array.from(map.values())
    }, [pagedSales])

    const totalRevenue = sales.reduce(
        (sum, sale) => sum + Number(sale.totalAmount || 0),
        0
    )
    const todayKey = dateKey(new Date())
    const todayRevenue = sales
        .filter((sale) => dateKey(sale.soldAt) === todayKey)
        .reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0)
    const totalSales = sales.length
    const averageSale = totalSales
        ? totalRevenue / totalSales
        : 0

    const selectedSale =
        selectedSaleId !== null ? detailsById[selectedSaleId] : null

    const handleSearchChange = (value) => {
        clearSelectionIfHidden(value, quickFilter, dateFilter)
        setSearch(value)
        setPage(1)
    }

    const handleQuickFilter = (value) => {
        clearSelectionIfHidden(search, value, dateFilter)
        setQuickFilter(value)
        setPage(1)
    }

    const handleDateFilter = (value) => {
        clearSelectionIfHidden(search, quickFilter, value)
        setDateFilter(value)
        setPage(1)
    }

    const handleSaleCreated = (result) => {
        setShowCreateModal(false)
        setSearch('')
        setQuickFilter('all')
        setDateFilter('all')
        setPage(1)

        if (result?.saleId) {
            pendingSelectionRef.current = result.saleId
        }

        setRefreshKey((previous) => previous + 1)
    }

    return (
        <div className="@container space-y-5">
            {/* ================= HEADER ================= */}
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
                <div className="flex flex-col gap-4 @lg:flex-row @lg:items-center @lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Sales Management
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            Track sales transactions and monitor sales activity.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 @lg:justify-end">
                        <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                            Rev:{' '}
                            <span className="font-bold text-slate-800">
                                RM {formatMoney(totalRevenue)}
                            </span>
                        </span>

                        <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                            Today:{' '}
                            <span className="font-bold text-slate-800">
                                RM {formatMoney(todayRevenue)}
                            </span>
                        </span>

                        <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                            Avg:{' '}
                            <span className="font-bold text-slate-800">
                                RM {formatMoney(averageSale)}
                            </span>
                        </span>

                        <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                            <span className="font-bold text-slate-800">
                                {totalSales}
                            </span>{' '}
                            orders
                        </span>

                        {canCreate && (
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="flex h-9 items-center justify-center gap-2 rounded-full bg-[#20334F] px-4 text-xs font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-[#304967]"
                            >
                                <Plus size={16} />
                                New Sale
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= TWO-COLUMN LAYOUT ================= */}
            <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                {/* TRANSACTIONS */}
                <div className="min-w-0 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
                    <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
                        SALES TRANSACTIONS
                    </p>

                    {/* FILTER / SEARCH TOOLBAR */}
                    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-2 @lg:flex-row @lg:items-center @lg:justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 shadow-sm">
                            <Search size={16} className="shrink-0 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                placeholder="Search Sale ID"
                                aria-label="Search Sale ID"
                                className="w-full min-w-0 bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => handleSearchChange('')}
                                    aria-label="Clear search"
                                    className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickFilter('all')}
                                className={`min-h-9 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                    quickFilter === 'all'
                                        ? 'border-[#20334F] bg-[#20334F] text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-white'
                                }`}
                            >
                                All Sales
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickFilter('today')}
                                className={`min-h-9 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                    quickFilter === 'today'
                                        ? 'border-[#20334F] bg-[#20334F] text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-white'
                                }`}
                            >
                                Today
                            </button>

                            <select
                                value={dateFilter}
                                onChange={(e) =>
                                    handleDateFilter(e.target.value)
                                }
                                aria-label="Date range"
                                className="min-h-9 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-teal-400"
                            >
                                <option value="all">All Dates</option>
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                            </select>

                            <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                                {filteredSales.length} transactions
                            </span>
                        </div>
                    </div>

                    {/* TRANSACTION LIST */}
                    <div className="mt-5">
                        {loading ? (
                            <p className="p-8 text-center text-sm text-slate-500">
                                Loading sales...
                            </p>
                        ) : error ? (
                            <p
                                role="alert"
                                className="p-8 text-center text-sm text-red-600"
                            >
                                {error}
                            </p>
                        ) : filteredSales.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                                <ReceiptText
                                    size={30}
                                    className="mx-auto text-slate-300"
                                />
                                <p className="mt-3 text-sm font-semibold text-slate-700">
                                    {sales.length === 0
                                        ? 'No sales recorded'
                                        : 'No matching sales found'}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {sales.length === 0
                                        ? 'Create a new sale to get started.'
                                        : 'Try a different search or date filter.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {groups.map((group) => (
                                    <div key={group.key} className="space-y-2">
                                        <div className="flex items-center justify-between gap-3 px-1">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                                {group.label}
                                            </p>

                                            <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                                                <span>
                                                    {group.sales.length}{' '}
                                                    {group.sales.length === 1
                                                        ? 'sale'
                                                        : 'sales'}
                                                </span>
                                                <span className="text-slate-300">
                                                    •
                                                </span>
                                                <span>
                                                    RM{' '}
                                                    {formatMoney(
                                                        group.sales.reduce(
                                                            (sum, sale) =>
                                                                sum +
                                                                Number(
                                                                    sale.totalAmount ||
                                                                        0
                                                                ),
                                                            0
                                                        )
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {group.sales.map((sale) => {
                                            const detail =
                                                detailsById[sale.saleId]
                                            const items = detail?.items || []
                                            const first = items[0]
                                            const summary = first
                                                ? `${first.productName}${
                                                      items.length > 1
                                                          ? ` +${items.length - 1}`
                                                          : ''
                                                  }`
                                                : 'Details unavailable'
                                            const selected =
                                                selectedSaleId === sale.saleId

                                            return (
                                                <button
                                                    key={sale.saleId}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedSaleId(
                                                            sale.saleId
                                                        )
                                                    }
                                                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                                                        selected
                                                            ? 'border-teal-300 bg-teal-50/80 shadow-sm ring-1 ring-teal-200'
                                                            : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                                            selected
                                                                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                                                                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        <ShoppingCart size={18} />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-bold text-slate-900">
                                                            Sale #{sale.saleId}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-xs text-slate-500">
                                                            {formatTime(
                                                                sale.soldAt
                                                            )}{' '}
                                                            · {items.length}{' '}
                                                            {items.length === 1
                                                                ? 'item'
                                                                : 'items'}{' '}
                                                            · {summary}
                                                        </p>
                                                    </div>

                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <span
                                                            className={`text-sm font-bold ${
                                                                selected
                                                                    ? 'text-teal-700'
                                                                    : 'text-slate-900'
                                                            }`}
                                                        >
                                                            RM{' '}
                                                            {formatMoney(
                                                                sale.totalAmount
                                                            )}
                                                        </span>

                                                        <ChevronRight
                                                            size={16}
                                                            className={
                                                                selected
                                                                    ? 'text-teal-600'
                                                                    : 'text-slate-300 transition group-hover:text-slate-500'
                                                            }
                                                        />
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* PAGINATION */}
                    {!loading && !error && (
                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-4">
                            <p className="text-[11px] text-slate-500">
                                Page {currentPage} of {totalPages} ·{' '}
                                {filteredSales.length} matching transactions
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    aria-label="Previous page"
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <span className="text-[11px] font-bold text-slate-700">
                                    {currentPage} / {totalPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    aria-label="Next page"
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* SALE DETAILS */}
                <div className="min-w-0 @lg:sticky @lg:top-4 [&>div]:rounded-2xl [&>div]:border [&>div]:border-slate-200/70 [&>div]:bg-white/85 [&>div]:shadow-sm [&>div]:backdrop-blur">
                    <SaleDetailsPanel
                        sale={selectedSale}
                        loading={
                            detailsLoading &&
                            selectedSaleId !== null &&
                            !selectedSale
                        }
                        error={selectedSaleId !== null ? error : ''}
                    />
                </div>
            </div>

            {canCreate && showCreateModal && (
                <CreateSaleModal
                    token={token}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleSaleCreated}
                />
            )}
        </div>
    )
}

export default Sales
