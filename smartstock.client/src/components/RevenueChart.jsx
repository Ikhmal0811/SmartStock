import { useState } from 'react'

const WIDTH = 700
const HEIGHT = 240
const PADDING_X = 28
const TOP = 16
const BOTTOM = 24
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM

const formatMoney = (value) =>
    `RM ${Number(value).toLocaleString('en-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`

const roundedTopPath = (x, y, width, height, radius = 8) => {
    const r = Math.min(radius, width / 2, height)

    return [
        `M ${x} ${y + height}`,
        `L ${x} ${y + r}`,
        `Q ${x} ${y} ${x + r} ${y}`,
        `L ${x + width - r} ${y}`,
        `Q ${x + width} ${y} ${x + width} ${y + r}`,
        `L ${x + width} ${y + height}`,
        'Z',
    ].join(' ')
}

function RevenueChart({ data, dateRange, loading, error }) {
    const [hoveredIndex, setHoveredIndex] = useState(null)

    const maxValue = Math.max(...data.map((item) => item.value), 1)
    const axisMax = Math.ceil(maxValue / 200) * 200
    const slot = (WIDTH - PADDING_X * 2) / Math.max(data.length, 1)
    const barWidth = Math.min(56, slot * 0.48)

    const bars = data.map((item, index) => {
        const rawHeight = (item.value / axisMax) * PLOT_HEIGHT
        const height = item.value === 0 ? 3 : rawHeight
        const x = PADDING_X + index * slot + (slot - barWidth) / 2
        const y = TOP + PLOT_HEIGHT - height

        return { item, index, x, y, height }
    })

    const hovered = hoveredIndex !== null ? bars[hoveredIndex] : null

    return (
        <section className="rounded-[20px] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        Revenue Analytics
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Track your sales performance over time.
                    </p>
                </div>

                <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                    {dateRange}
                </span>
            </div>

            <div className="relative mt-6 h-64 w-full sm:h-72">
                {error ? (
                    <div
                        role="alert"
                        className="flex h-full items-center justify-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-red-600"
                    >
                        {error}
                    </div>
                ) : loading ? (
                    <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                        Loading revenue data...
                    </div>
                ) : (
                    <>
                        <svg
                            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                            preserveAspectRatio="none"
                            className="h-full w-full"
                            role="img"
                            aria-label="Revenue chart for the last seven days"
                        >
                            <defs>
                                <linearGradient
                                    id="revenueBar"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor="#8975F2" />
                                    <stop offset="100%" stopColor="#5546D9" />
                                </linearGradient>

                                <linearGradient
                                    id="revenueBarActive"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor="#A496F7" />
                                    <stop offset="100%" stopColor="#6C5CE7" />
                                </linearGradient>

                                <linearGradient
                                    id="revenueBarZero"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor="#C7D2FE" />
                                    <stop offset="100%" stopColor="#A5B4FC" />
                                </linearGradient>
                            </defs>

                            {[0, 1, 2, 3, 4].map((step) => {
                                const y = TOP + (PLOT_HEIGHT / 4) * step

                                return (
                                    <line
                                        key={step}
                                        x1={PADDING_X / 2}
                                        x2={WIDTH - PADDING_X / 2}
                                        y1={y}
                                        y2={y}
                                        stroke="#E2E8F0"
                                        strokeWidth="1"
                                        strokeDasharray={
                                            step === 4 ? '0' : '4 6'
                                        }
                                    />
                                )
                            })}

                            {bars.map(({ item, index, x, y, height }) => (
                                <path
                                    key={item.date || item.day}
                                    d={roundedTopPath(x, y, barWidth, height)}
                                    fill={
                                        hoveredIndex === index
                                            ? 'url(#revenueBarActive)'
                                            : item.value === 0
                                              ? 'url(#revenueBarZero)'
                                              : 'url(#revenueBar)'
                                    }
                                    className="cursor-pointer transition-opacity duration-200 hover:opacity-90"
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                />
                            ))}
                        </svg>

                        {hovered && (
                            <div
                                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-[#20334F] px-3 py-2 text-white shadow-lg"
                                style={{
                                    left: `${
                                        ((hovered.x + barWidth / 2) / WIDTH) *
                                        100
                                    }%`,
                                    top: `${((hovered.y - 8) / HEIGHT) * 100}%`,
                                }}
                            >
                                <p className="text-[11px] font-semibold">
                                    {hovered.item.day}
                                </p>
                                <p className="mt-0.5 text-xs text-white/80">
                                    {formatMoney(hovered.item.value)}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div
                className="mt-2 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400"
                style={{
                    paddingLeft: `${(PADDING_X / WIDTH) * 100}%`,
                    paddingRight: `${(PADDING_X / WIDTH) * 100}%`,
                }}
            >
                {data.map((item) => (
                    <span key={item.date || item.day}>
                        {item.day.slice(0, 3)}
                    </span>
                ))}
            </div>
        </section>
    )
}

export default RevenueChart
