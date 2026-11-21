using Microsoft.EntityFrameworkCore;
using TaskMaster.Application.Interfaces;
using TaskMaster.Domain.Entities;

namespace TaskMaster.Infrastructure.Persistence.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly AppDbContext _db;

    public TaskRepository(AppDbContext db){
        this._db = db;
    }
    public async Task AddAsync(TaskItem task, CancellationToken cancellationToken = default)
    {
        await _db.Tasks.AddAsync(task, cancellationToken);
    }

    public async Task<IReadOnlyList<TaskItem>> GetActiveByUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
         return await _db.Tasks
         .Where(t => t.UserId == userId && t.IsActive)
         .OrderByDescending(t => t.CreatedAtUtc)
         .ToListAsync(cancellationToken);
    }

    public  async Task<TaskItem?> GetByIdAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
         return await _db.Tasks
         .FirstOrDefaultAsync(t => t.UserId == userId && t.Id == taskId , cancellationToken);
    }
}