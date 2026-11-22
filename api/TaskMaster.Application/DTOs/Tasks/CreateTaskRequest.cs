using TaskMaster.Domain.Enums;

namespace TaskMaster.Application.DTOs.Tasks;

public class CreateTaskRequest
{
    public string Title {get; set;} = string.Empty;
    public string? Notes {get; set;}

    public TaskType Type {get; set;}

    public RecurrenceType RecurrenceType {get; set;} = RecurrenceType.None;

    public DateOnly? SpecificDate {get; set;}
}
