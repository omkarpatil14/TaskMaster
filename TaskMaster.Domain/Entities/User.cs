namespace TaskMaster.Domain.Entities;

public class User{
public Guid Id { get; set; }
public string Email { get; set; } = string.Empty;
public string PassWordHash {get; set;} = string.Empty;
public string DisplayName {get; set;} = string.Empty;
public DateTime CreatedAtUtc {get; set;}
public DateTime? UpdatedAtUtc {get; set;}

public ICollection<TaskItem> Tasks {get; set;} = new List<TaskItem>();
public ICollection<DailyMetric> DailyMetrics {get;set;} = new List<DailyMetric>();
}