var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();

app.MapPost("/chat", (ChatRequest req) =>
{
    // TODO: integrate real AI model here
    var reply = $"You said: {req.Message}";
    return Results.Ok(new { reply });
});

app.Run();

record ChatRequest(string Message);
