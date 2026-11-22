import { useEffect, useMemo, useState } from 'react'
import {
    CalendarDays,
    Wallet,
    ShoppingCart,
    Package,
    AlertTriangle,
} from 'lucide-react'
import KpiCard from '../components/KpiCard'
import RevenueChart from '../components/RevenueChart'
import TopSellingProducts from '../components/TopSellingProducts'
import InventoryHealthChart from '../components/InventoryHealthChart'
import RecentSales from '../components/RecentSales'
import StockAlerts from '../components/StockAlerts'
import DashboardQuickActions from '../components/DashboardQuickActions'
import {
    DASHBOARD_DATE_RANGE,
    LIVE_KPI_CONFIG,
} from '../data/dashboardMockData'
import {
    buildRevenueSeries,
    formatCurrency,
    getLastSevenDayKeys,
    getTodaySalesMetrics,
} from '../utils/dashboardRevenue'
import {
    buildInventorySummary,
    buildTopSellingProducts,
    getStockAlerts,
} from '../utils/dashboardInventory'
import { getRecentSales } from '../utils/dashboardActivity'

const ICONS = {
    wallet: Wallet,
    cart: ShoppingCart,
    package: Package,
    alert: AlertTriangle,
}

const initialStatus = (token) => ({
    loading: Boolean(token),
    error: token ? '' : 'Session unavailable.',
})

function Dashboard({ token }) {
    const [sales, setSales] = useState([])
    const [products, setProducts] = useState([])
    const [topRows, setTopRows] = useState([])
    const [salesStatus, setSalesStatus] = useState(() => initialStatus(token))
    const [inventoryStatus, setInventoryStatus] = useState(() =>
        initialStatus(token)
    )
    const [topStatus, setTopStatus] = useState(() => initialStatus(token))

    useEffect(() => {
        if (!token) return undefined

        const controller = new AbortController()
        const sevenDayKeys = getLastSevenDayKeys()
        const startDate = sevenDayKeys[0]
        const endDate = sevenDayKeys[sevenDayKeys.length - 1]
        const headers = { Authorization: `Bearer ${token}` }

        const requestJson = async (url, label) => {
            const response = await fetch(url, {
                headers,
                signal: controller.signal,
            })

            if (response.status === 401) {
                throw new Error('Session expired. Please log in again.')
            }

            if (response.status === 403) {
                throw new Error(`You do not have permission to view ${label}.`)
            }

            if (!response.ok) {
                throw new Error(`Unable to load ${label}.`)
            }

            return response.json()
        }

        const track = (request, setStatus, onSuccess) =>
            request
                .then((value) => {
                    if (controller.signal.aborted) return

                    onSuccess(value)
                    setStatus({ loading: false, error: '' })
                })
                .catch((reason) => {
                    if (
                        controller.signal.aborted ||
                        reason.name === 'AbortError'
                    ) {
                        return
                    }

                    setStatus({
                        loading: false,
                        error: reason.message || 'Unable to load data.',
                    })
                })

        Promise.allSettled([
            track(
                requestJson('/api/sales', 'sales data'),
                setSalesStatus,
                (value) => setSales(Array.isArray(value) ? value : [])
            ),
            track(
                requestJson('/api/products', 'inventory data'),
                setInventoryStatus,
                (value) => setProducts(Array.isArray(value) ? value : [])
            ),
            track(
                requestJson(
                    `/api/sales/top-products?start=${startDate}&end=${endDate}`,
                    'top-selling products'
                ),
                setTopStatus,
                (value) => setTopRows(Array.isArray(value) ? value : [])
            ),
        ])

        return () => controller.abort()
    }, [token])

    const todayMetrics = useMemo(() => getTodaySalesMetrics(sales), [sales])
    const revenueSeries = useMemo(() => buildRevenueSeries(sales), [sales])
    const inventory = useMemo(() => buildInventorySummary(products), [products])
    const topProducts = useMemo(() => buildTopSellingProducts(topRows), [topRows])
    const recentSales = useMemo(() => getRecentSales(sales), [sales])
    const stockAlerts = useMemo(() => getStockAlerts(products), [products])

    const liveValues = {
        revenue: {
            value: formatCurrency(todayMetrics.revenue),
            description: 'Revenue generated today',
        },
        sales: {
            value: String(todayMetrics.count),
            description: 'Completed transactions',
        },
        inventory: {
            value: formatCurrency(inventory.inventoryValue),
            description: 'Current inventory value',
        },
        alerts: {
            value: String(inventory.alertCount),
            description: `${inventory.lowStock} low stock · ${inventory.outOfStock} out of stock`,
        },
    }

    const kpiCards = LIVE_KPI_CONFIG.map((card) => {
        const isSales = card.id === 'revenue' || card.id === 'sales'
        const status = isSales ? salesStatus : inventoryStatus
        const currencyCard = card.id === 'revenue' || card.id === 'inventory'

        return {
            ...card,
            value: status.error
                ? currencyCard
                    ? 'RM —'
                    : '—'
                : status.loading
                  ? currencyCard
                      ? 'RM …'
                      : '…'
                  : liveValues[card.id].value,
            description: status.error
                ? 'Data unavailable'
                : status.loading
                  ? 'Loading data...'
                  : liveValues[card.id].description,
        }
    })

    const alerts = [
        salesStatus.error && {
            id: 'sales',
            text: `${salesStatus.error} Sales metrics are unavailable.`,
        },
        inventoryStatus.error && {
            id: 'inventory',
            text: `${inventoryStatus.error} Inventory metrics are unavailable.`,
        },
        topStatus.error && {
            id: 'top',
            text: `${topStatus.error} Top-selling products are unavailable.`,
        },
    ].filter(Boolean)

    return (
        <div className="@container space-y-5">
            {/* ================= HEADER ================= */}
            <header className="rounded-[20px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Dashboard Overview
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            Here's what's happening with your business today.
                        </p>
                    </div>

                    <div
                        className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
                        aria-label={`Date range: ${DASHBOARD_DATE_RANGE}`}
                    >
                        <CalendarDays size={16} className="text-slate-400" />
                        {DASHBOARD_DATE_RANGE}
                    </div>
                </div>
            </header>

            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    role="alert"
                    className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {alert.text}
                </div>
            ))}

            {/* ================= KPI CARDS ================= */}
            <div className="grid gap-4 @md:grid-cols-2 @xl:grid-cols-4">
                {kpiCards.map((card) => (
                    <KpiCard
                        key={card.id}
                        {...card}
                        icon={ICONS[card.icon]}
                    />
                ))}
            </div>

            {/* ================= REVENUE ANALYTICS ================= */}
            <RevenueChart
                data={revenueSeries}
                dateRange={DASHBOARD_DATE_RANGE}
                loading={salesStatus.loading}
                error={salesStatus.error}
            />

            {/* ================= BOTTOM ANALYTICS ================= */}
            <div className="grid gap-5 @xl:grid-cols-2">
                <TopSellingProducts
                    products={topProducts}
                    loading={topStatus.loading}
                    error={topStatus.error}
                />
                <InventoryHealthChart
                    data={inventory.healthData}
                    loading={inventoryStatus.loading}
                    error={inventoryStatus.error}
                />
            </div>

            {/* ================= RECENT ACTIVITY ================= */}
            <div className="grid gap-5 @lg:grid-cols-2">
                <RecentSales
                    sales={recentSales}
                    loading={salesStatus.loading}
                    error={salesStatus.error}
                />
                <StockAlerts
                    products={stockAlerts}
                    loading={inventoryStatus.loading}
                    error={inventoryStatus.error}
                />
            </div>

            {/* ================= QUICK ACTIONS ================= */}
            <DashboardQuickActions token={token} />
        </div>
    )
}

export default Dashboard
