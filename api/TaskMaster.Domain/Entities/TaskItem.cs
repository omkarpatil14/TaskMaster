using TaskMaster.Domain.Enums;

namespace TaskMaster.Domain.Entities;

public class TaskItem
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public TaskType Type { get; set; }
    public RecurrenceType RecurrenceType { get; set; } = RecurrenceType.None;
    public DateOnly? SpecificDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? ArchivedAtUtc { get; set; }

    public User User { get; set; } = null!;
    public ICollection<TaskCompletion> Completions { get; set; } = new List<TaskCompletion>();
}