import './HistorySidebar.css'

interface Conversation {
  id: string
  title: string
  timestamp: number
}

interface HistorySidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
}

export function HistorySidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: HistorySidebarProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="history-sidebar">
      <button className="new-chat-btn" onClick={onNewChat} title="Start a new conversation">
        <span className="icon">+</span>
        <span className="label">New Chat</span>
      </button>

      <div className="history-list">
        {conversations.length === 0 ? (
          <p className="empty-history">No conversations yet</p>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              className={`history-item ${activeConversationId === conv.id ? 'active' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
              title={conv.title}
            >
              <div className="history-content">
                <p className="history-title">{conv.title}</p>
                <p className="history-date">{formatDate(conv.timestamp)}</p>
              </div>
              <button
                className="delete-btn"
                onClick={e => {
                  e.stopPropagation()
                  onDeleteConversation(conv.id)
                }}
                title="Delete conversation"
                aria-label="Delete"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
