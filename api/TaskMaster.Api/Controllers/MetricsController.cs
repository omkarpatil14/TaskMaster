using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMaster.Api.Extension;
using TaskMaster.Application.DTOs.Metrics;
using TaskMaster.Application.Interfaces.Services;

namespace TaskMaster.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class MetricsController : ControllerBase
{
    private readonly IMetricsService _metricsService;

    public MetricsController(IMetricsService metricsService)
    {
        _metricsService = metricsService;
    }

    /// <summary>Heatmap data for Scriptable. Example: /api/metrics/heatmap?from=2026-10-01&to=2026-11-22</summary>
    [HttpGet("heatmap")]
    public async Task<ActionResult<HeatmapResponse>> Heatmap(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var result = await _metricsService.GetHeatmapAsync(userId, from, to, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}