namespace TaskMaster.Domain.Entities;

public class DailyMetric
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateOnly Date { get; set; }
    public int TasksExpected { get; set; }
    public int TasksCompleted { get; set; }
    public decimal CompletionRate { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public User User { get; set; } = null!;
}