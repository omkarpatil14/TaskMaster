namespace TaskMaster.Application.DTOs.Tasks;

public class CompleteTaskRequest
{
    /// <summary>Local calendar day as yyyy-MM-dd. Prefer string so JSON binding is reliable.</summary>
    public string? Date { get; set; }
}
