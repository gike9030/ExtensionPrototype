namespace Extension.ApiService.Models;

public record ChatRequest(
    string Message, 
    string? SessionId
);