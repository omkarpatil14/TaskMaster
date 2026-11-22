using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskMaster.Api.Extension;
using TaskMaster.Application.DTOs.Tasks;
using TaskMaster.Application.Interfaces.Services;

namespace TaskMaster.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class TasksController: ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TaskResponse>>> List(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var result = await _taskService.ListActiveAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponse>> Create(CreateTaskRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var UserId = User.GetUserId();
            var result = await _taskService.CreateAsync(UserId, request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest( new {message = ex.Message});
        }
    }

    [HttpPost("{taskId:guid}/complete")]
    public async Task<IActionResult> Complete(Guid taskId, [FromBody]CompleteTaskRequest? request, CancellationToken cancellationToken)
    {
        try{
            var userId = User.GetUserId();
            var date = request?.Date?? DateOnly.FromDateTime(DateTime.UtcNow);
            await _taskService.CompleteAsync(userId, taskId, date, cancellationToken);
            return NoContent();

        }
        catch(InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message});
        }
    }

    [HttpDelete("{taskId:guid}")]
    public async Task<IActionResult> Archive(Guid taskId, CancellationToken cancellationToken)
    {
        try{
            var userId = User.GetUserId();
            await _taskService.ArchiveAsync(userId,taskId, cancellationToken);
            return NoContent();
        }
        catch(InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message});
        }
    }
}