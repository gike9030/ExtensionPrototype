using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace Extension.ApiService.Services;

public sealed class GeminiChatService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
{
    private const string DefaultModel = "models/gemini-2.0-flash";
    private List<string>? _availableModels;

    public async Task<string> GenerateReplyAsync(string message, CancellationToken cancellationToken)
    {
        var apiKey = configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Missing Gemini API key.");
        }

        var configuredModel = configuration["Gemini:Model"];
        if (string.IsNullOrWhiteSpace(configuredModel))
        {
            configuredModel = DefaultModel;
        }

        _availableModels ??= await FetchAvailableModelsAsync(apiKey, cancellationToken);
        
        var modelsToTry = new List<string> { configuredModel };
        modelsToTry.AddRange(_availableModels.Where(m => m != configuredModel));

        foreach (var model in modelsToTry)
        {
            try
            {
                return await TryGenerateReplyAsync(message, model, apiKey, cancellationToken);
            }
            catch (HttpRequestException ex) when (ex.Message.Contains("429"))
            {
                Console.WriteLine($"Quota exceeded for {model}, trying next...");
                continue;
            }
        }

        throw new InvalidOperationException($"All models exhausted quota. Tried: {string.Join(", ", modelsToTry)}");
    }

    private async Task<List<string>> FetchAvailableModelsAsync(string apiKey, CancellationToken cancellationToken)
    {
        try
        {
            var httpClient = httpClientFactory.CreateClient("gemini");
            var requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}";
            
            using var response = await httpClient.GetAsync(requestUrl, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine("Failed to fetch available models, using default.");
                return new List<string> { DefaultModel };
            }

            using var document = await JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync(cancellationToken),
                cancellationToken: cancellationToken);

            var models = new List<string>();
            if (document.RootElement.TryGetProperty("models", out var modelsArray))
            {
                foreach (var modelElement in modelsArray.EnumerateArray())
                {
                    if (modelElement.TryGetProperty("name", out var nameElement))
                    {
                        var name = nameElement.GetString();
                        if (!string.IsNullOrWhiteSpace(name))
                        {
                            models.Add(name);
                        }
                    }
                }
            }

            return models.Count > 0 ? models : new List<string> { DefaultModel };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching available models: {ex.Message}");
            return new List<string> { DefaultModel };
        }
    }

    private async Task<string> TryGenerateReplyAsync(string message, string model, string apiKey, CancellationToken cancellationToken)
    {
        var httpClient = httpClientFactory.CreateClient("gemini");
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