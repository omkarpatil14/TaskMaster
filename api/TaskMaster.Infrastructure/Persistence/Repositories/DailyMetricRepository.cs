using Microsoft.EntityFrameworkCore;
using TaskMaster.Application.Interfaces;
using TaskMaster.Domain.Entities;

namespace TaskMaster.Infrastructure.Persistence.Repositories;

public class DailyMetricRepository : IDailyMetricRepository
{
    private readonly AppDbContext _db;

    public DailyMetricRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DailyMetric?> GetByDateAsync(Guid userId, DateOnly date, CancellationToken cancellationToken = default)
    {
        return await _db.DailyMetrics
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Date == date, cancellationToken);
    }

    public async Task<IReadOnlyList<DailyMetric>> GetByDateRangeAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        return await _db.DailyMetrics
            .Where(x => x.UserId == userId && x.Date >= from && x.Date <= to)
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(DailyMetric metric, CancellationToken cancellationToken = default)
    {
        await _db.DailyMetrics.AddAsync(metric, cancellationToken);
    }
}