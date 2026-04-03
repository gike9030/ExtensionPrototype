using System.Text.Json;
using Postgrest.Attributes;
using Postgrest.Models;
using System.Net;

var builder = WebApplication.CreateBuilder(args);

// 1. SERVICES
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

var app = builder.Build();

// 2. MIDDLEWARE
app.UseCors();

// 3. THE CHAT ENDPOINT (Auto-Discovery + Fixed URL)
app.MapPost("/chat", async (ChatRequest req, Supabase.Client db, IHttpClientFactory httpFactory, IConfiguration config) =>
{
    var apiKey = config["Gemini:ApiKey"];
    if (string.IsNullOrEmpty(apiKey)) return Results.Problem("Missing Gemini API Key in config.");

    var http = httpFactory.CreateClient("gemini");

    // --- STEP 1: AUTO-DISCOVER THE BEST FREE MODEL ---
    string? discoveredModel = null;
    try 
    {
        // We use the v1 endpoint to list models
        var listUrl = $"https://generativelanguage.googleapis.com/v1/models?key={apiKey}";
        var listResponse = await http.GetAsync(listUrl);
        
        if (listResponse.IsSuccessStatusCode)
        {
            using var listDoc = await JsonDocument.ParseAsync(await listResponse.Content.ReadAsStreamAsync());
            var models = listDoc.RootElement.GetProperty("models");

            foreach (var m in models.EnumerateArray())
            {
                string name = m.GetProperty("name").GetString() ?? "";
                var methods = m.GetProperty("supportedGenerationMethods").EnumerateArray().Select(x => x.GetString());

                // We want a model that supports "generateContent"
                if (methods.Contains("generateContent"))
                {
                    discoveredModel = name; 
                    // Prefer "flash" models as they are the standard free tier
                    if (name.Contains("flash")) break; 
                }
            }
        }
    }
    catch (Exception ex) { 
        Console.WriteLine($"Discovery failed: {ex.Message}"); 
    }

    if (string.IsNullOrEmpty(discoveredModel)) {
        return Results.Problem("Could not find any available Gemini models for your API Key.");
    }

    Console.WriteLine($"DEBUG: Using discovered model path: {discoveredModel}");

    // --- STEP 2: CALL THE DISCOVERED MODEL ---
    // IMPORTANT: The URL must be: Domain + /v1/ + ModelPath + :generateContent
    string chatUrl = $"https://generativelanguage.googleapis.com/v1/{discoveredModel}:generateContent?key={apiKey}";
    
    var payload = new { 
        contents = new[] { 
            new { parts = new[] { new { text = req.Message } } } 
        } 
    };

    var response = await http.PostAsJsonAsync(chatUrl, payload);

    if (!response.IsSuccessStatusCode)
    {
        var errBody = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"GOOGLE API ERROR: {errBody}");
        return Results.Problem($"Gemini Error: {errBody}");
    }

    using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
    
    // Safely extract the AI text
    var aiText = doc.RootElement
        .GetProperty("candidates")[0]
        .GetProperty("content")
        .GetProperty("parts")[0]
        .GetProperty("text")
        .GetString() ?? "No response";

    // --- STEP 3: SAVE TO SUPABASE (SAFE) ---
    try {
        await db.From<MessageRecord>().Insert(new MessageRecord {
            SessionId = req.SessionId ?? "default",
            UserText = req.Message,
            AiText = aiText
        });
    } catch (Exception ex) { 
        Console.WriteLine($"SUPABASE ERROR: {ex.Message}"); 
    }

    return Results.Ok(new { reply = aiText });
});

app.Run();

// 4. DATA MODELS

public record ChatRequest(string Message, string? SessionId);

[Table("messages")]
public class MessageRecord : BaseModel
{
    // Make sure your Supabase table has a primary key column named 'id' (int4/int8)
    [PrimaryKey("id", false)] 
    public int Id { get; set; }

    [Column("session_id")]
    public string SessionId { get; set; } = default!;

    [Column("user_text")]
    public string UserText { get; set; } = default!;

    [Column("ai_text")]
    public string AiText { get; set; } = default!;
}