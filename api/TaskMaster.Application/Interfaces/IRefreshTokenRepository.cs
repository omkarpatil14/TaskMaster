using TaskMaster.Domain.Entities;

namespace TaskMaster.Application.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken> GetByHashAsync (string TokenHash, CancellationToken cancellationtoke = default);
    Task AddAsync(RefreshToken token , CancellationToken cancellationToken = default);
     Task RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}