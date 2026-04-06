using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace Extension.ApiService.Services;

public sealed class GeminiChatService
{
    private const string DefaultModel = "models/gemini-2.0-flash";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public GeminiChatService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<string> GenerateReplyAsync(string message, CancellationToken cancellationToken)
    {
        var apiKey = _configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Missing Gemini API key.");
        }

        var model = _configuration["Gemini:Model"];
        if (string.IsNullOrWhiteSpace(model))
        {
            model = DefaultModel;
        }

        var httpClient = _httpClientFactory.CreateClient("gemini");
        var requestUrl = $"https://generativelanguage.googleapis.com/v1/{model}:generateContent?key={apiKey}";
        var payload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = message }
                    }
                }
            }
        };

        using var response = await httpClient.PostAsJsonAsync(requestUrl, payload, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Gemini error: {errorBody}");
        }

        using var document = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);

        return ExtractReply(document.RootElement);
    }

    private static string ExtractReply(JsonElement rootElement)
    {
        if (!rootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            return "No response";
        }

        var candidate = candidates[0];
        if (!candidate.TryGetProperty("content", out var content))
        {
            return "No response";
        }

        if (!content.TryGetProperty("parts", out var parts) || parts.GetArrayLength() == 0)
        {
            return "No response";
        }

        var part = parts[0];
        return part.TryGetProperty("text", out var text) ? text.GetString() ?? "No response" : "No response";
    }
}