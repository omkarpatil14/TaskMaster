using Microsoft.AspNetCore.Mvc;
using TaskMaster.Application.DTOs.Auth;
using TaskMaster.Application.Interfaces.Services;

namespace TaskMaster.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
   private readonly IAuthService _authService;

   public AuthController (IAuthService _authService){
    this._authService = _authService;
   }

   [HttpPost("register")]
   public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
   {
    try 
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);
        return result;
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest( new {message = ex.Message});
    }
   }

     [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _authService.LoginAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }   
}
