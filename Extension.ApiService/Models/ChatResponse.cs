namespace Extension.ApiService.Models;

public record ChatResponse(
    string Reply,
    DeleteRange? DeletionInfo = null
);

public record DeleteRange(
    int StartLine,
    int EndLine,
    int InsertLine
);
