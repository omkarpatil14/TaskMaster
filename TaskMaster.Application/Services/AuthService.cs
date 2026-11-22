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

        var (token, expires) = _jwtTokenService.CreateToken(user);

        return new AuthResponse
        {
             UserId = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            AccessToken = token,
            ExpiresAtUtc = expires
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

        var (token , expires) = _jwtTokenService.CreateToken(user);

        return new AuthResponse{
            UserId = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            AccessToken = token,
            ExpiresAtUtc = expires
        };

    }
}