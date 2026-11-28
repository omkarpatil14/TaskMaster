using System.Linq.Expressions;
using Microsoft.AspNetCore.Identity;
using TaskMaster.Application.DTOs.Auth;
using TaskMaster.Application.Interfaces;
using TaskMaster.Application.Interfaces.Services;
using TaskMaster.Domain.Entities;

namespace TaskMaster.Application.Services;

public class AuthService : IAuthService
{

    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtTokenService _jwtTokenService;

    private readonly PasswordHasher<User> _passwordHasher = new();

    public AuthService(IUnitOfWork unitOfWork, IJwtTokenService jwtTokenService)
    {
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
    }

    
    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
       var email = request.Email.Trim().ToLowerInvariant();
       var user = await _unitOfWork.Users.GetByEmailAsync(email, cancellationToken)
         ?? throw new InvalidOperationException("Invalid email or password");

       var result = _passwordHasher.VerifyHashedPassword(user, user.PassWordHash, request.Password);
       if(result == PasswordVerificationResult.Failed)
        throw new InvalidOperationException("Invalid email or password");

        return await IssueTokensAsync(user, cancellationToken);

     
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if(string.IsNullOrWhiteSpace(refreshToken)) return;

        var stored  = await _unitOfWork.RefreshTokens.GetByHashAsync(
            _jwtTokenService.HashToken(refreshToken),cancellationToken
        );

          if (stored is null || stored.RevokedAtUtc is not null) return;

        stored.RevokedAtUtc = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);


    }

    public  async Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if(string.IsNullOrWhiteSpace(refreshToken))
            throw new InvalidOperationException("refresh token is required");

        var hash = _jwtTokenService.HashToken(refreshToken);
        var temp = await _unitOfWork.RefreshTokens.GetByHashAsync(hash,cancellationToken)
            ?? throw new InvalidOperationException("Invalid refresh token.");

        if(temp.RevokedAtUtc is not null)
        {
                await _unitOfWork.RefreshTokens.RevokeAllForUserAsync(temp.UserId, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                throw new InvalidOperationException("Refresh token has been revoked.");
        }

         if (temp.ExpiresAtUtc <= DateTime.UtcNow)
            throw new InvalidOperationException("Refresh token has expired.");

        // ROTATION: the old token is single-use.
        temp.RevokedAtUtc = DateTime.UtcNow;

        return await IssueTokensAsync(temp.User, cancellationToken);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken cancellationToken)
    {
        var (accessToken, accessExpires) = _jwtTokenService.CreateToken(user);
        var (refreshToken, refreshExpires) = _jwtTokenService.CreateRefreshToken();

        await _unitOfWork.RefreshTokens.AddAsync(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _jwtTokenService.HashToken(refreshToken),   // store only the hash
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = refreshExpires
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            AccessToken = accessToken,
            ExpiresAtUtc = accessExpires,
            RefreshToken = refreshToken,                 // raw token goes to the client only once
            RefreshTokenExpiresAtUtc = refreshExpires
        };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if(string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new InvalidOperationException("Email and password are required.");
        }

        var existing  = await _unitOfWork.Users.GetByEmailAsync(email,cancellationToken);

        if(existing is not null)
         throw new InvalidOperationException("Email is already registered");

        var user =  new User{
            Id = Guid.NewGuid(),
            Email = email,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)?email : request.DisplayName.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        user.PassWordHash = _passwordHasher.HashPassword(user, request.Password);

        await _unitOfWork.Users.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await IssueTokensAsync(user, cancellationToken);

    }
}