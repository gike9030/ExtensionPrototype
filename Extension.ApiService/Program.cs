using Extension.ApiService.Models;
using Extension.ApiService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddHttpClient("gemini");

builder.Services.AddSingleton(sp => {
    var config = sp.GetRequiredService<IConfiguration>();
    return new Supabase.Client(
        config["Supabase:Url"] ?? "",
        config["Supabase:ServiceRoleKey"] ?? ""
    );
});
builder.Services.AddSingleton<GeminiChatService>();
builder.Services.AddSingleton<SupabaseMessageStore>();
builder.Services.AddSingleton<ChatProcessor>();

var app = builder.Build();

app.UseCors();

app.MapPost("/chat", async (ChatRequest request, ChatProcessor chatProcessor, CancellationToken cancellationToken) =>
{
    var reply = await chatProcessor.ProcessAsync(request, cancellationToken);
    return Results.Ok(new { reply });
});

app.Run();
