using Microsoft.EntityFrameworkCore;
using TaskMaster.Application.Interfaces;
using TaskMaster.Domain.Entities;

namespace TaskMaster.Infrastructure.Persistence.Repositories;


public class RefreshTokenRepository : IRefreshTokenRepository
{

    private readonly AppDbContext _db;

    public RefreshTokenRepository(AppDbContext db)
    {
        _db = db;
    }
    public async Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default)
    {
        await _db.RefreshToken.AddAsync(token, cancellationToken);
    }

    public async Task<RefreshToken> GetByHashAsync(string TokenHash, CancellationToken cancellationtoke = default)
    {
        return await _db.RefreshToken
        .Include(r => r.User)
        .FirstOrDefaultAsync(x => x.TokenHash == TokenHash, cancellationtoke);
    }

    public async Task RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
       var active = await _db.RefreshToken
        .Where(r => r.UserId == userId && r.RevokedAtUtc == null)
        .ToListAsync(cancellationToken);

        foreach(var token in active)
            token.RevokedAtUtc = DateTime.UtcNow;
    }
}