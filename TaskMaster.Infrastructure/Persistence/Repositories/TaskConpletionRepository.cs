using Microsoft.EntityFrameworkCore;
using TaskMaster.Application.Interfaces;
using TaskMaster.Domain.Entities;

namespace TaskMaster.Infrastructure.Persistence.Repositories;

public class TaskCompletionRepository : ITaskCompletionRepository
{
    private readonly AppDbContext _db;

    public TaskCompletionRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<TaskCompletion?> GetAsync(Guid userId, Guid taskId, DateOnly date, CancellationToken cancellationToken = default)
    {
        return await _db.TaskCompletions
            .FirstOrDefaultAsync(x => x.UserId == userId && x.TaskId == taskId && x.Date == date, cancellationToken);
    }

    public async Task<IReadOnlyList<TaskCompletion>> GetByDateRangeAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        return await _db.TaskCompletions
            .Where(x => x.UserId == userId && x.Date >= from && x.Date <= to)
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(TaskCompletion completion, CancellationToken cancellationToken = default)
    {
        await _db.TaskCompletions.AddAsync(completion, cancellationToken);
    }
}