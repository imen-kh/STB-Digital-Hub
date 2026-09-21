FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY StbDigitalHub.Api.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
RUN mkdir -p /app/wwwroot/uploads/avatars
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "dotnet StbDigitalHub.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]
