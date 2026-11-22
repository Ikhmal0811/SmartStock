const SIZE = 180
const STROKE = 22
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function InventoryHealthChart({ data, loading, error }) {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const hasData = total > 0

    const { segments } = data.reduce(
        (acc, item) => {
            const length = hasData
                ? (item.value / total) * CIRCUMFERENCE
                : 0
            const visibleLength = Math.max(length - 4, 0)

            return {
                cumulative: acc.cumulative + length,
                segments: [
                    ...acc.segments,
                    {
                        ...item,
                        dashArray: `${visibleLength} ${
                            CIRCUMFERENCE - visibleLength
                        }`,
                        dashOffset: -acc.cumulative,
                    },
                ],
            }
        },
        { cumulative: 0, segments: [] }
    )

    return (
        <section className="rounded-[20px] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
                Inventory Health
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                Current stock distribution by status.
            </p>

            {error ? (
                <div
                    role="alert"
                    className="mt-5 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-red-600"
                >
                    {error}
                </div>
            ) : loading ? (
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    Loading inventory health...
                </div>
            ) : (
                <div className="mt-5 flex flex-col items-center gap-6 @xl:flex-row @xl:justify-center">
                    <div className="relative h-[180px] w-[180px] shrink-0">
                        <svg
                            viewBox={`0 0 ${SIZE} ${SIZE}`}
                            className="h-full w-full"
                            role="img"
                            aria-label="Inventory health donut chart"
                        >
                            <circle
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={RADIUS}
                                fill="none"
                                stroke="#F1F5F9"
                                strokeWidth={STROKE}
                            />

                            {hasData &&
                                segments.map((segment) => (
                                    <circle
                                        key={segment.label}
                                        cx={SIZE / 2}
                                        cy={SIZE / 2}
                                        r={RADIUS}
                                        fill="none"
                                        stroke={segment.color}
                                        strokeWidth={STROKE}
                                        strokeDasharray={segment.dashArray}
                                        strokeDashoffset={segment.dashOffset}
                                        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                                        className="transition-opacity duration-200 hover:opacity-80"
                                    />
                                ))}
                        </svg>

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-900">
                                {hasData ? total : 0}
                            </span>
                            <span className="text-xs text-slate-500">
                                {hasData ? 'Total products' : 'No products'}
                            </span>
                        </div>
                    </div>

                    <ul className="w-full max-w-[220px] space-y-3">
                        {data.map((item) => (
                            <li
                                key={item.label}
                                className="flex items-center justify-between gap-3"
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="truncate text-sm text-slate-600">
                                        {item.label}
                                    </span>
                                </div>

                                <span className="shrink-0 text-sm font-bold text-slate-800">
                                    {item.value}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    )
}

export default InventoryHealthChart
