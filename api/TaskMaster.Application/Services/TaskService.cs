using System.Data;
using TaskMaster.Application.DTOs.Tasks;
using TaskMaster.Application.Interfaces;
using TaskMaster.Application.Interfaces.Services;
using TaskMaster.Domain.Entities;
using TaskMaster.Domain.Enums;


namespace TaskMaster.Application.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _unitOfWork;

    public TaskService(IUnitOfWork unitOfWork){
        _unitOfWork = unitOfWork;
    }
    public async Task ArchiveAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(userId, taskId, cancellationToken);
        
        task.IsActive = false;
        task.ArchivedAtUtc = DateTime.UtcNow;
        task.UpdatedAtUtc = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task CompleteAsync(Guid userId, Guid taskId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(userId, taskId,cancellationToken)
         ?? throw new InvalidOperationException("Task not found");

        var existing = await _unitOfWork.Completions.GetAsync(userId, taskId, date,cancellationToken);

        if( existing is null)
        {
            await _unitOfWork.Completions.AddAsync(new TaskCompletion
            {
                Id = Guid.NewGuid(),
                TaskId = task.Id,
                UserId = userId,
                Date = date,
                Status = CompletionStatus.Completed,
                CompletedAtUtc = DateTime.UtcNow,
                CreatedAtUtc = DateTime.UtcNow
            }, cancellationToken);
        }else{
            existing.Status = CompletionStatus.Completed;
            existing.CompletedAtUtc = DateTime.UtcNow;
        }

        await UpsertDailyMetricAsync(userId, date, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }


    private async Task UpsertDailyMetricAsync(Guid userId , DateOnly date, CancellationToken cancellationToken){
        var tasks = await _unitOfWork.Tasks.GetActiveByUserAsync(userId, cancellationToken);
        var expected = tasks.Count(t => TaskScheduleHelper.IsExpectedOn(t, date));

        var completions = await _unitOfWork.Completions.GetByDateRangeAsync(userId, date, date, cancellationToken);
        var completed = completions.Count(c => c.Status == CompletionStatus.Completed);

        var rate = expected == 0 ? 0 : Math.Round((decimal)completed / expected , 2);

        var metric = await _unitOfWork.DailyMetrics.GetByDateAsync(userId, date, cancellationToken);
         if (metric is null)
        {
            await _unitOfWork.DailyMetrics.AddAsync(new DailyMetric
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Date = date,
                TasksExpected = expected,
                TasksCompleted = completed,
                CompletionRate = rate,
                CreatedAtUtc = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            metric.TasksExpected = expected;
            metric.TasksCompleted = completed;
            metric.CompletionRate = rate;
            metric.UpdatedAtUtc = DateTime.UtcNow;
        }
    }

    public async Task<TaskResponse> CreateAsync(Guid userId, CreateTaskRequest request, CancellationToken cancellationToken = default)
    {
        if(string.IsNullOrWhiteSpace(request.Title))
         throw new InvalidOperationException("Title is required");

        if(request.Type == TaskType.SpecificDate && request.SpecificDate is null )
            throw new InvalidOperationException("SpecificDate is required for specificDate");
               
        if (request.Type == TaskType.Recurring && request.RecurrenceType == RecurrenceType.None)
            throw new InvalidOperationException("RecurrenceType is required for Recurring tasks.");

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = request.Title.Trim(),
            Notes = request.Notes,
            Type = request.Type,
            RecurrenceType = request.Type == TaskType.Recurring ? request.RecurrenceType : RecurrenceType.None,
            SpecificDate = request.Type == TaskType.SpecificDate ? request.SpecificDate : null,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _unitOfWork.Tasks.AddAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Map(task);

    }

    public async Task<IReadOnlyList<TaskResponse>> ListActiveAsync(Guid userId, CancellationToken cancellationToken = default)
    {
       var tasks = await _unitOfWork.Tasks.GetActiveByUserAsync(userId, cancellationToken);
       return tasks.Select(Map).ToList();

    }

    public async Task UncompleteAsync(Guid userId, Guid taskId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var existing = await _unitOfWork.Completions.GetAsync(userId, taskId, date,cancellationToken);

        if(existing is null)
            return;

        existing.Status = CompletionStatus.Pending;
        existing.CompletedAtUtc = null;

        await UpsertDailyMetricAsync(userId, date, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

     private static TaskResponse Map(TaskItem task) => new()
    {
        Id = task.Id,
        Title = task.Title,
        Notes = task.Notes,
        Type = task.Type,
        RecurrenceType = task.RecurrenceType,
        SpecificDate = task.SpecificDate,
        IsActive = task.IsActive,
        CreatedAtUtc = task.CreatedAtUtc
    };
}