using TaskMaster.Domain.Enums;

namespace TaskMaster.Domain.Entities;

public class TaskCompletion
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public Guid UserId { get; set; }
    public DateOnly Date { get; set; }
    public CompletionStatus Status { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public TaskItem Task { get; set; } = null!;
}