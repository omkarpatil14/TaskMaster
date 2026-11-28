using TaskMaster.Application.Interfaces;
using TaskMaster.Infrastructure.Persistence.Repositories;

namespace TaskMaster.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _db;

    public UnitOfWork(AppDbContext db)
    {
        _db = db;
        Users = new UserRepository(db);
        Tasks = new TaskRepository(db);
        Completions = new TaskCompletionRepository(db);
        DailyMetrics = new DailyMetricRepository(db);
        RefreshTokens = new RefreshTokenRepository(db);
    }

    public IUserRepository Users { get; }
    public ITaskRepository Tasks { get; }
    public ITaskCompletionRepository Completions { get; }
    public IDailyMetricRepository DailyMetrics { get; }
    public IRefreshTokenRepository RefreshTokens { get; }
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _db.SaveChangesAsync(cancellationToken);
    }
}