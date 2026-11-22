namespace TaskMaster.Application.DTOs.Metrics;

public class HeatmapResponse
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public IReadOnlyList<HeatmapDayDto> Days { get; set; } = Array.Empty<HeatmapDayDto>();
}