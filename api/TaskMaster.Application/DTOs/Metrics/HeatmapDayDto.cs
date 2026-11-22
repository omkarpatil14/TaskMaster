namespace TaskMaster.Application.DTOs.Metrics;

public class HeatmapDayDto
{
    public string Date {get; set;} = string.Empty;
    public int Expected {get; set;}
    public int Completed {get; set;}
    public decimal Rate {get;set;}
}