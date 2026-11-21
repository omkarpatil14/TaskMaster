using TaskMaster.Domain.Entities;

namespace TaskMaster.Application.Interfaces;

public interface ITaskRepository
{
    Task<TaskItem?> GetByIdAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaskItem>> GetActiveByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task  AddAsync(TaskItem task, CancellationToken cancellationToken = default);
}