
using TaskMaster.Domain.Enums;

namespace TaskMaster.Application.DTOs.Tasks;

public class TaskResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public TaskType Type { get; set; }
    public RecurrenceType RecurrenceType { get; set; }
    public DateOnly? SpecificDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    /// <summary>True when completed on the date requested by the list call.</summary>
    public bool CompletedOnDate { get; set; }
}