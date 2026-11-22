using TaskMaster.Application.DTOs.Metrics;
using TaskMaster.Application.Interfaces;
using TaskMaster.Application.Interfaces.Services;
using TaskMaster.Domain.Enums;

namespace TaskMaster.Application.Services;

public class MetricsService : IMetricsService
{
    private readonly IUnitOfWork _unitOfWork;

    public MetricsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<HeatmapResponse> GetHeatmapAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        if (to < from)
            throw new InvalidOperationException("'to' must be >= 'from'.");

        var tasks = await _unitOfWork.Tasks.GetActiveByUserAsync(userId, cancellationToken);
        var completions = await _unitOfWork.Completions.GetByDateRangeAsync(userId, from, to, cancellationToken);

        var days = new List<HeatmapDayDto>();

        for (var date = from; date <= to; date = date.AddDays(1))
        {
            var expected = tasks.Count(t => TaskScheduleHelper.IsExpectedOn(t, date));
            var completed = completions.Count(c =>
                c.Date == date && c.Status == CompletionStatus.Completed);

            var rate = expected == 0 ? 0 : Math.Round((decimal)completed / expected, 2);

            days.Add(new HeatmapDayDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Expected = expected,
                Completed = completed,
                Rate = rate
            });
        }

        return new HeatmapResponse
        {
            From = from.ToString("yyyy-MM-dd"),
            To = to.ToString("yyyy-MM-dd"),
            Days = days
        };
    }
}