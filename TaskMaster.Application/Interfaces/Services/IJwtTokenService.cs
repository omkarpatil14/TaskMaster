using TaskMaster.Domain.Entities;

namespace TaskMaster.Application.Interfaces.Services;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateToken(User user);
}