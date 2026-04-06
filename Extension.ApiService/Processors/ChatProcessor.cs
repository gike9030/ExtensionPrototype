using Extension.ApiService.Models;
using Extension.ApiService.Repositories;
using Extension.ApiService.Services;
using Microsoft.Extensions.Logging;

namespace Extension.ApiService.Processors;

public sealed class ChatProcessor(
    GeminiChatService geminiChatService,
    SupabaseRepository supabaseRepository,
    ILogger<ChatProcessor> logger)
{
    public async Task<string> ProcessAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var reply = await geminiChatService.GenerateReplyAsync(request.Message, cancellationToken);

        try
        {
            await supabaseRepository.SaveAsync(request.SessionId, request.Message, reply);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to save chat message to Supabase.");
        }

        return reply;
    }
}