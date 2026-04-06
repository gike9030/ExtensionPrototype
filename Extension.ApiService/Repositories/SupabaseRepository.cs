using Extension.ApiService.Models;

namespace Extension.ApiService.Repositories;

public sealed class SupabaseRepository(Supabase.Client client)
{
    public async Task SaveAsync(string? sessionId, string userText, string aiText)
    {
        var record = new MessageRecord
        {
            SessionId = sessionId ?? "default",
            UserText = userText,
            AiText = aiText
        };

        await client.From<MessageRecord>().Insert(record);
    }
}