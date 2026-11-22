namespace TaskMaster.Application.Interfaces;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    ITaskRepository Tasks { get; }
    ITaskCompletionRepository Completions { get; }
    IDailyMetricRepository DailyMetrics { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}