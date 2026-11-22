using SmartStock.API.Helpers;
using Xunit;

namespace SmartStock.Tests;

public class SalesDateWindowTests
{
    [Fact]
    public void TryCreate_SevenDayWindow_UsesExplicitMalaysiaOffset()
    {
        var created = SalesDateWindow.TryCreate(
            "2026-11-14",
            "2026-11-20",
            out var window,
            out _);

        Assert.True(created);
        Assert.Equal(TimeSpan.FromHours(8), SalesDateWindow.MalaysiaOffset);
        Assert.Equal(new DateTime(2026, 11, 14), window!.Start);
        Assert.Equal(new DateTime(2026, 11, 21), window.EndExclusive);
        Assert.Equal(TimeSpan.FromDays(7), window.EndExclusive - window.Start);
    }

    [Fact]
    public void Contains_MalaysiaMidnight_IsInclusiveStartAndExclusiveEnd()
    {
        var created = SalesDateWindow.TryCreate(
            "2026-11-20",
            "2026-11-20",
            out var window,
            out _);

        Assert.True(created);
        Assert.True(window!.Contains(new DateTime(2026, 11, 20, 0, 0, 0)));
        Assert.True(window.Contains(new DateTime(2026, 11, 20, 23, 59, 59)));
        Assert.False(window.Contains(new DateTime(2026, 11, 19, 23, 59, 59)));
        Assert.False(window.Contains(new DateTime(2026, 11, 21, 0, 0, 0)));
    }

    [Fact]
    public void Contains_DoesNotDependOnServerLocalTimeZone()
    {
        var created = SalesDateWindow.TryCreate(
            "2026-11-14",
            "2026-11-20",
            out var window,
            out _);

        Assert.True(created);
        Assert.Equal(DateTimeKind.Unspecified, window!.Start.Kind);
        Assert.Equal(DateTimeKind.Unspecified, window.EndExclusive.Kind);
        Assert.Equal(new DateTime(2026, 11, 14), window.Start);
        Assert.Equal(new DateTime(2026, 11, 21), window.EndExclusive);
        Assert.True(window.Contains(new DateTime(2026, 11, 20, 23, 59, 59)));
        Assert.False(window.Contains(new DateTime(2026, 11, 21)));
    }

    [Fact]
    public void TryCreate_InvalidRange_ReturnsFalse()
    {
        var created = SalesDateWindow.TryCreate(
            "2026-11-20",
            "2026-11-14",
            out var window,
            out var error);

        Assert.False(created);
        Assert.Null(window);
        Assert.Equal("Invalid date range.", error);
    }
}
