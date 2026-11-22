function KpiCard({ label, value, description, icon: Icon, gradient }) {
    return (
        <div
            className="relative overflow-hidden rounded-[20px] p-4 text-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl @3xl:p-5"
            style={{ backgroundImage: gradient }}
        >
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />

            <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <Icon size={20} strokeWidth={2} />
            </div>

            <div className="relative pr-10">
                <p className="text-xs font-medium text-white/80">{label}</p>
                <p className="mt-2 text-lg font-bold leading-tight tracking-tight @3xl:text-2xl">
                    {value}
                </p>
            </div>

            <p className="relative mt-3 text-xs text-white/80">{description}</p>
        </div>
    )
}

export default KpiCard
