using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/", (IConfiguration configs) =>
{
    var vars = new
    {
        databaseUrl = configs["DatabaseUrl"] ?? "EMPTY",
        jwtKey = configs["JwtKey"] ?? "EMPTY",
        publicUrl = configs["PublicUrl"] ?? "EMPTY",
        enabled = configs["Enabled"] ?? "EMPTY",
    };

    Console.WriteLine(JsonSerializer.Serialize(vars));

    return new { Status = "healthly", Version = "1.0.0" };
});

app.Run();