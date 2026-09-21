using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using StbDigitalHub.Api.Data;
using StbDigitalHub.Api.Entities;
using StbDigitalHub.Api.Options;
using StbDigitalHub.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "STB Digital Hub API",
        Version = "v1",
        Description = "API d'authentification sécurisée (inscription, login + OTP, session JWT)."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Collez le JWT obtenu après verify-otp. Exemple : eyJhbGciOi..."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<OtpOptions>(builder.Configuration.GetSection(OtpOptions.SectionName));
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection(SmtpOptions.SectionName));
builder.Services.Configure<AppOptions>(builder.Configuration.GetSection(AppOptions.SectionName));

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("La section de configuration 'Jwt' est introuvable.");

if (string.IsNullOrWhiteSpace(jwtOptions.Key) || jwtOptions.Key.Length < 32)
{
    throw new InvalidOperationException("Jwt:Key doit contenir au moins 32 caractères.");
}

builder.Services.AddDbContext<StbDigitalHubDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("La chaîne de connexion 'DefaultConnection' est introuvable."),
        sql => sql.EnableRetryOnFailure(
            maxRetryCount: 8,
            maxRetryDelay: TimeSpan.FromSeconds(15),
            errorNumbersToAdd: [40613])));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

var corsOrigins = builder.Configuration.GetSection("App:CorsOrigins").Get<string[]>()
    ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim())
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray()
    ?? ["http://localhost:4200", "https://localhost:4200"];

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IPasswordHasher<Client>, PasswordHasher<Client>>();
var useBrevo = string.Equals(builder.Configuration["Email:Provider"], "Brevo", StringComparison.OrdinalIgnoreCase)
    || !string.IsNullOrWhiteSpace(builder.Configuration["Brevo:ApiKey"]);
if (useBrevo)
{
    builder.Services.AddHttpClient<IEmailSender, BrevoEmailSender>(client =>
        client.Timeout = TimeSpan.FromSeconds(30));
}
else
{
    builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
}
builder.Services.AddScoped<OtpService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ClientProfileService>();
builder.Services.AddScoped<CardActionConfirmationService>();
builder.Services.AddScoped<DigiCarteService>();
builder.Services.AddScoped<DigiCompteService>();
builder.Services.AddScoped<DigiCreditService>();
builder.Services.AddScoped<DigiEpargneService>();
builder.Services.AddScoped<DigiTransfertService>();
builder.Services.AddScoped<HomeService>();
builder.Services.AddScoped<ChatAssistantService>();
builder.Services.AddScoped<NotificationService>();

var app = builder.Build();

if (app.Configuration.GetValue("ApplyMigrations", false))
{
    using var migrateScope = app.Services.CreateScope();
    var db = migrateScope.ServiceProvider.GetRequiredService<StbDigitalHubDbContext>();
    var logger = migrateScope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");

    // Azure SQL Free / Serverless se met en pause : le 1er appel échoue (40613) le temps du réveil.
    const int maxAttempts = 8;
    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await db.Database.MigrateAsync();
            break;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            logger.LogWarning(
                ex,
                "Azure SQL pas encore disponible (tentative {Attempt}/{Max}). Nouvel essai dans 10s.",
                attempt,
                maxAttempts);
            await Task.Delay(TimeSpan.FromSeconds(10));
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "STB Digital Hub API v1");
        options.RoutePrefix = "swagger";
    });
}

var webRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "avatars"));
app.Environment.WebRootPath = webRoot;

app.UseForwardedHeaders();
app.UseCors("Frontend");
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRoot)
});
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();

app.Run();
