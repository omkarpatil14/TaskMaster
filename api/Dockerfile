# Build from the api/ folder as Docker context (contains the .sln + projects)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY TaskMaster.sln ./
COPY TaskMaster.Domain/TaskMaster.Domain.csproj TaskMaster.Domain/
COPY TaskMaster.Application/TaskMaster.Application.csproj TaskMaster.Application/
COPY TaskMaster.Infrastructure/TaskMaster.Infrastructure.csproj TaskMaster.Infrastructure/
COPY TaskMaster.Api/TaskMaster.Api.csproj TaskMaster.Api/

RUN dotnet restore TaskMaster.Api/TaskMaster.Api.csproj

COPY . .
RUN dotnet publish TaskMaster.Api/TaskMaster.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 10000

ENTRYPOINT ["dotnet", "TaskMaster.Api.dll"]
