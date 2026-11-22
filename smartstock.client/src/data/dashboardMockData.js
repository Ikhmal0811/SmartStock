// Presentation configuration for the Dashboard. All card values are supplied
// at runtime by Dashboard.jsx from live endpoints — no mock figures remain.
export const DASHBOARD_DATE_RANGE = 'Last 7 Days'

export const LIVE_KPI_CONFIG = [
    {
        id: 'revenue',
        label: "Today's Revenue",
        description: 'Revenue generated today',
        icon: 'wallet',
        gradient: 'linear-gradient(135deg, #5546D9 0%, #8975F2 100%)',
    },
    {
        id: 'sales',
        label: "Today's Sales",
        description: 'Completed transactions',
        icon: 'cart',
        gradient: 'linear-gradient(135deg, #087F8C 0%, #20B8A4 100%)',
    },
    {
        id: 'inventory',
        label: 'Inventory Value',
        description: 'Current inventory value',
        icon: 'package',
        gradient: 'linear-gradient(135deg, #2454A8 0%, #4E91F2 100%)',
    },
    {
        id: 'alerts',
        label: 'Stock Alerts',
        description: 'Low and out-of-stock products',
        icon: 'alert',
        gradient: 'linear-gradient(135deg, #D87926 0%, #F1B255 100%)',
    },
]
