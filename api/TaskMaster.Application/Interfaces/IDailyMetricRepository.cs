using TaskMaster.Domain.Entities;

namespace TaskMaster.Application.Interfaces;

public interface IDailyMetricRepository
{
    Task<DailyMetric?> GetByDateAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DailyMetric>> GetByDateRangeAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
    Task AddAsync(DailyMetric metric, CancellationToken cancellationToken = default);
}