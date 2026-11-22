using TaskMaster.Application.DTOs.Tasks;

namespace TaskMaster.Application.Interfaces.Services;

public interface ITaskService
{
    Task<TaskResponse> CreateAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaskResponse>> ListActiveAsync(Guid userId, CancellationToken cancellationToken = default);
    Task ArchiveAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default);
    Task CompleteAsync(Guid userId, Guid taskId, DateOnly date, CancellationToken cancellationToken = default);
    Task UncompleteAsync(Guid userId, Guid taskId, DateOnly date, CancellationToken cancellationToken = default);
}