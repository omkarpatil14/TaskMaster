using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TaskMaster.Application.Interfaces;
using TaskMaster.Infrastructure.Persistence;
using TaskMaster.Application.Services;
using TaskMaster.Application.Interfaces.Services;
namespace TaskMaster.Infrastructure.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("NeonConnection")
            ?? throw new InvalidOperationException("Connection string 'NeonConnection' is missing.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, Persistence.Repositories.UserRepository>();
        services.AddScoped<ITaskRepository , Persistence.Repositories.TaskRepository>();
        services.AddScoped<ITaskCompletionRepository , Persistence.Repositories.TaskCompletionRepository>();
        services.AddScoped<IDailyMetricRepository, Persistence.Repositories.DailyMetricRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        
        return services;
    }
}