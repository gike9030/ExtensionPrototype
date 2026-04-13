using Extension.ApiService.Configuration;
using Extension.ApiService.Models;
using Extension.ApiService.Processors;
using Extension.ApiService.Repositories;
using Extension.ApiService.Services;

var builder = WebApplication.CreateBuilder(args);

var devConfigPath = Path.Combine(builder.Environment.ContentRootPath, "Configuration", "config", "devconfig.yaml");
builder.Configuration.AddYamlFileIfExists(devConfigPath);

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
builder.Services.AddSingleton<SupabaseRepository>();
builder.Services.AddSingleton<ChatProcessor>();

var app = builder.Build();

app.UseCors();

app.MapPost("/chat", async (ChatRequest request, ChatProcessor chatProcessor, CancellationToken cancellationToken) =>
{
    var response = await chatProcessor.ProcessAsync(request, cancellationToken);
    return Results.Ok(response);
});

app.Run();
