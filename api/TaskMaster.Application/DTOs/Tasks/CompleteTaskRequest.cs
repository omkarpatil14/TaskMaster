namespace TaskMaster.Application.DTOs.Tasks;

public class CompleteTaskRequest
{
    /// <summary>If null, use today in UTC (or your chosen timezone later).</summary>
    public DateOnly? Date { get; set; }
}