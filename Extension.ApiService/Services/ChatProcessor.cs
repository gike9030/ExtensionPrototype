using Extension.ApiService.Models;
using Microsoft.Extensions.Logging;

namespace Extension.ApiService.Services;

public sealed class ChatProcessor
{
    private readonly GeminiChatService _geminiChatService;
    private readonly SupabaseMessageStore _messageStore;
    private readonly ILogger<ChatProcessor> _logger;

    public ChatProcessor(
        GeminiChatService geminiChatService,
        SupabaseMessageStore messageStore,
        ILogger<ChatProcessor> logger)
    {
        _geminiChatService = geminiChatService;
        _messageStore = messageStore;
        _logger = logger;
    }

    public async Task<string> ProcessAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var reply = await _geminiChatService.GenerateReplyAsync(request.Message, cancellationToken);

        try
        {
            await _messageStore.SaveAsync(request.SessionId, request.Message, reply);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Failed to save chat message to Supabase.");
        }

        return reply;
    }
}