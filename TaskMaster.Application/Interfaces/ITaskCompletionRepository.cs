using TaskMaster.Domain.Entities;
using TaskMaster.Domain.Enums;

namespace TaskMaster.Application.Interfaces;

public interface ITaskCompletionRepository
{
    Task<TaskCompletion?> GetAsync(Guid userId, Guid taskId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaskCompletion>> GetByDateRangeAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
    Task AddAsync(TaskCompletion completion, CancellationToken cancellationToken = default);
}