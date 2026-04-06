using Postgrest.Attributes;
using Postgrest.Models;

namespace Extension.ApiService.Models;

[Table("messages")]
public class MessageRecord : BaseModel
{
    [PrimaryKey("id", false)]
    public int Id { get; set; }

    [Column("session_id")]
    public string SessionId { get; set; } = string.Empty;

    [Column("user_text")]
    public string UserText { get; set; } = string.Empty;

    [Column("ai_text")]
    public string AiText { get; set; } = string.Empty;
}