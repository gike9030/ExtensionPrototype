import './HistorySidebar.css'
import { SessionCard } from './SessionCard'
import { FileContext } from './FileContext'

interface Conversation {
  id: string
  title: string
  timestamp: number
  messages?: Array<{ role: string; content: string }>
}

interface HistorySidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
  activeFilePath?: string
}

export function HistorySidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  activeFilePath,
}: HistorySidebarProps) {
  return (
    <div className="history-sidebar">
      {/* Header with CHAT label and icons */}
      <div className="sidebar-header">
        <div className="sidebar-title">CHAT</div>
        <div className="sidebar-actions">
          <button className="sidebar-icon-btn" title="Search" aria-label="Search">
            🔍
          </button>
          <button className="sidebar-icon-btn" title="Filter" aria-label="Filter">
            ⋮
          </button>
        </div>
      </div>

      {/* SESSIONS label */}
      <div className="sessions-label">SESSIONS</div>

      {/* Sessions list */}
      <div className="sessions-list">
        {conversations.length === 0 ? (
          <div className="empty-sessions">
            <p>No sessions yet</p>
            <button className="create-session-btn" onClick={onNewChat}>
              + Create session
            </button>
          </div>
        ) : (
          conversations.map(conv => (
            <SessionCard
              key={conv.id}
              id={conv.id}
              title={conv.title}
              summary={
                conv.messages && conv.messages[0]
                  ? conv.messages[0].content.substring(0, 60)
                  : undefined
              }
              timestamp={conv.timestamp}
              isActive={activeConversationId === conv.id}
              onSelect={onSelectConversation}
              onDelete={onDeleteConversation}
            />
          ))
        )}
      </div>

      {/* File context at bottom */}
      <FileContext filePath={activeFilePath} />
    </div>
  )
}
