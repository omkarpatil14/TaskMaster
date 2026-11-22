using System.Security.Claims;
using Microsoft.AspNetCore.Routing.Tree;

namespace TaskMaster.Api.Extension;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user){

        var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");

        if(value is null || !Guid.TryParse(value, out var userId))
         throw new UnauthorizedAccessException("user id cache is missing");

        return userId;
        
        }
}