using TaskMaster.Application.DTOs.Metrics;

namespace TaskMaster.Application.Interfaces.Services;

public interface IMetricsService
{
    Task<HeatmapResponse> GetHeatmapAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
}