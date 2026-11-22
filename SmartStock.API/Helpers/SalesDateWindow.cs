using System.Globalization;

namespace SmartStock.API.Helpers
{
    // Sale.SoldAt is mapped to "timestamp without time zone". The stored value
    // is Malaysia wall-clock time, so the dashboard window must be evaluated as
    // UTC+08:00 explicitly instead of using the API host's local timezone.
    public sealed class SalesDateWindow
    {
        public static readonly TimeSpan MalaysiaOffset = TimeSpan.FromHours(8);

        public DateTime Start { get; }
        public DateTime EndExclusive { get; }

        private SalesDateWindow(DateTime start, DateTime endExclusive)
        {
            Start = DateTime.SpecifyKind(start, DateTimeKind.Unspecified);
            EndExclusive = DateTime.SpecifyKind(endExclusive, DateTimeKind.Unspecified);
        }

        public bool Contains(DateTime soldAt) =>
            DateTime.SpecifyKind(soldAt, DateTimeKind.Unspecified) >= Start &&
            DateTime.SpecifyKind(soldAt, DateTimeKind.Unspecified) < EndExclusive;

        public static bool TryCreate(
            string? start,
            string? end,
            out SalesDateWindow? window,
            out string error)
        {
            window = null;
            error = string.Empty;

            if (!DateTime.TryParseExact(
                    start,
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var startDate) ||
                !DateTime.TryParseExact(
                    end,
                    "yyyy-MM-dd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var endDate) ||
                endDate.Date < startDate.Date)
            {
                error = "Invalid date range.";
                return false;
            }

            var startUtc = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc)
                - MalaysiaOffset;
            var endUtc = DateTime.SpecifyKind(endDate.Date.AddDays(1), DateTimeKind.Utc)
                - MalaysiaOffset;

            window = new SalesDateWindow(
                startUtc + MalaysiaOffset,
                endUtc + MalaysiaOffset);

            return true;
        }
    }
}
