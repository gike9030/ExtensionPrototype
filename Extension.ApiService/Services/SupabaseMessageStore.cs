using Extension.ApiService.Models;

namespace Extension.ApiService.Services;

public sealed class SupabaseMessageStore
{
    private readonly Supabase.Client _client;

    public SupabaseMessageStore(Supabase.Client client)
    {
        _client = client;
    }

    public async Task SaveAsync(string? sessionId, string userText, string aiText)
    {
        var record = new MessageRecord
        {
            SessionId = sessionId ?? "default",
            UserText = userText,
            AiText = aiText
        };

        await _client.From<MessageRecord>().Insert(record);
    }
}