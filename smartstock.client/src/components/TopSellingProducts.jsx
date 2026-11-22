function TopSellingProducts({ products, loading, error }) {
    const maxQuantity = Math.max(...products.map((item) => item.quantity), 1)

    return (
        <section className="rounded-[20px] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
                Top-Selling Products
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                Best performers over the last 7 days.
            </p>

            {error ? (
                <div
                    role="alert"
                    className="mt-5 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-red-600"
                >
                    {error}
                </div>
            ) : loading ? (
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Loading top-selling products...
                </div>
            ) : products.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No sales recorded in the last 7 days.
                </div>
            ) : (
                <div className="mt-5 space-y-4">
                    {products.map((product) => (
                        <div key={product.rank}>
                            <div className="flex items-center gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                                    {product.rank}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {product.name}
                                        </p>
                                        <p className="shrink-0 text-xs font-bold text-slate-600">
                                            {product.quantity} sold
                                        </p>
                                    </div>

                                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-indigo-50">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#5546D9] to-[#8975F2] transition-all duration-500"
                                            style={{
                                                width: `${
                                                    (product.quantity /
                                                        maxQuantity) *
                                                    100
                                                }%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}

export default TopSellingProducts
