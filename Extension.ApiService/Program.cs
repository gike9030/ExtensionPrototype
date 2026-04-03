using System.Text.Json;
using Postgrest.Attributes;
using Postgrest.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddHttpClient("openrouter", (sp, client) =>
{
    var key = sp.GetRequiredService<IConfiguration>()["OpenRouter:ApiKey"]!;
    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {key}");
});

builder.Services.AddSingleton(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    return new Supabase.Client(
        config["Supabase:Url"]!,
        config["Supabase:ServiceRoleKey"]!
    );
});

var app = builder.Build();
app.UseCors();

var supabase = app.Services.GetRequiredService<Supabase.Client>();
await supabase.InitializeAsync();

app.MapPost("/chat", async (ChatRequest req, Supabase.Client db) =>
{
    var aiText = req.Message;

    await db.From<MessageRecord>().Insert(new MessageRecord
    {
        SessionId = req.SessionId ?? Guid.NewGuid().ToString(),
        UserText = req.Message,
        AiText = aiText
    });

    return Results.Ok(new { reply = aiText });
});

app.Run();

record ChatRequest(string Message, string? SessionId);

[Table("messages")]
public class MessageRecord : BaseModel
{
    [Column("session_id")]
    public string SessionId { get; set; } = default!;

    [Column("user_text")]
    public string UserText { get; set; } = default!;

    [Column("ai_text")]
    public string AiText { get; set; } = default!;
}
